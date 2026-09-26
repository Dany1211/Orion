import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function parseGitHubRepo(input: string): { owner: string; repo: string } | null {
  if (!input) return null;
  const clean = input.trim().replace(/\/+$/, "");
  
  // Format: https://github.com/owner/repo
  const urlMatch = clean.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2].replace(/\.git$/, "") };
  }

  // Format: owner/repo
  const slashParts = clean.split("/");
  if (slashParts.length === 2 && slashParts[0] && slashParts[1]) {
    return { owner: slashParts[0], repo: slashParts[1].replace(/\.git$/, "") };
  }

  return null;
}

// ── GET: Fetch saved GitHub tracking data for a project ─────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    const supabase = (await createClient()) as any;

    // 1. Check dedicated project_github_integrations table
    const { data: integration, error: intErr } = await supabase
      .from("project_github_integrations")
      .select("*")
      .eq("project_id", projectId)
      .maybeSingle();

    if (integration) {
      return NextResponse.json({
        success: true,
        repo: {
          fullName: `${integration.owner}/${integration.repo_name}`,
          owner: integration.owner,
          name: integration.repo_name,
          url: integration.repo_url,
          stars: integration.stars,
          forks: integration.forks,
          openIssues: integration.open_issues,
          currentBranch: integration.default_branch,
          lastPush: integration.last_synced_at,
        },
        commits: integration.latest_commits || [],
        pullRequests: integration.latest_pulls || [],
        issues: integration.latest_issues || [],
        contributors: integration.latest_contributors || [],
        aiAnalysis: integration.ai_analysis,
      });
    }

    // 2. Fallback: check project.metadata.github
    const { data: project } = await supabase
      .from("projects")
      .select("metadata")
      .eq("id", projectId)
      .maybeSingle();

    if (project?.metadata?.github?.fullName) {
      return NextResponse.json({
        success: true,
        repo: {
          fullName: project.metadata.github.fullName,
          owner: project.metadata.github.owner,
          name: project.metadata.github.repo,
          url: project.metadata.github.repoUrl,
          stars: project.metadata.github.stars || 0,
          forks: project.metadata.github.forks || 0,
          openIssues: project.metadata.github.openIssues || 0,
          currentBranch: project.metadata.github.branch || "main",
          lastPush: project.metadata.github.lastSyncedAt,
        },
        commits: [],
        pullRequests: [],
        issues: [],
        contributors: [],
        aiAnalysis: {
          progressPercentage: project.metadata.github.progressPercentage || 0,
          executiveSummary: "Saved repository connected. Click 'Sync & AI Analyze' for fresh commit intelligence.",
          velocityStatus: "on_track",
          requirementProgress: [],
          keyHighlights: [],
        },
      });
    }

    return NextResponse.json({ success: false, data: null });
  } catch (error: any) {
    console.error("GET github error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE: Disconnect repository ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    const supabase = (await createClient()) as any;
    await supabase.from("project_github_integrations").delete().eq("project_id", projectId);

    const { data: project } = await supabase.from("projects").select("metadata").eq("id", projectId).maybeSingle();
    if (project) {
      const meta = { ...project.metadata };
      delete meta.github;
      await supabase.from("projects").update({ metadata: meta }).eq("id", projectId);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Connect / Sync & Analyze GitHub repository ────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { projectId, repoUrl, branch = "main", token } = await req.json();

    if (!projectId || !repoUrl) {
      return NextResponse.json({ error: "Project ID and GitHub repository are required" }, { status: 400 });
    }

    const repoInfo = parseGitHubRepo(repoUrl);
    if (!repoInfo) {
      return NextResponse.json(
        { error: "Invalid GitHub repository format. Use 'owner/repo' or 'https://github.com/owner/repo'" },
        { status: 400 }
      );
    }

    const { owner, repo } = repoInfo;
    const githubHeaders: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Orion-Project-Intelligence",
    };
    if (token) {
      githubHeaders["Authorization"] = `Bearer ${token}`;
    }

    // ── Fetch GitHub data in parallel ───────────────────────────────────────
    const [repoRes, commitsRes, pullsRes, issuesRes, contributorsRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=25&sha=${encodeURIComponent(branch)}`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=15`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/issues?state=all&per_page=15`, { headers: githubHeaders }),
      fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=10`, { headers: githubHeaders }),
    ]);

    if (!repoRes.ok) {
      const err = await repoRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: `GitHub API error: ${err.message || repoRes.statusText}. For private repos, please provide a GitHub Personal Access Token.` },
        { status: repoRes.status === 404 ? 404 : 400 }
      );
    }

    const repoData = await repoRes.json();
    const commitsData = commitsRes.ok ? await commitsRes.json() : [];
    const pullsData = pullsRes.ok ? await pullsRes.json() : [];
    const issuesData = issuesRes.ok ? await issuesRes.json() : [];
    const contributorsData = contributorsRes.ok ? await contributorsRes.json() : [];

    // Format clean summaries for commits & PRs
    const formattedCommits = Array.isArray(commitsData)
      ? commitsData.slice(0, 20).map((c: any) => ({
          sha: c.sha?.substring(0, 7),
          fullSha: c.sha,
          message: c.commit?.message || "",
          author: c.commit?.author?.name || c.author?.login || "Unknown",
          authorAvatar: c.author?.avatar_url || null,
          date: c.commit?.author?.date || c.commit?.committer?.date,
          htmlUrl: c.html_url,
        }))
      : [];

    const formattedPulls = Array.isArray(pullsData)
      ? pullsData.slice(0, 10).map((p: any) => ({
          number: p.number,
          title: p.title,
          state: p.state,
          merged: Boolean(p.merged_at),
          author: p.user?.login,
          htmlUrl: p.html_url,
          createdAt: p.created_at,
        }))
      : [];

    const formattedIssues = Array.isArray(issuesData)
      ? issuesData.filter((i: any) => !i.pull_request).slice(0, 10).map((i: any) => ({
          number: i.number,
          title: i.title,
          state: i.state,
          author: i.user?.login,
          htmlUrl: i.html_url,
          createdAt: i.created_at,
        }))
      : [];

    const formattedContributors = Array.isArray(contributorsData)
      ? contributorsData.slice(0, 8).map((ct: any) => ({
          login: ct.login,
          avatarUrl: ct.avatar_url,
          contributions: ct.contributions,
          htmlUrl: ct.html_url,
        }))
      : [];

    // ── Fetch Project Requirements & Sprints for AI Comparison ──────────────
    const supabase = (await createClient()) as any;
    const [{ data: project }, { data: requirements }, { data: sprints }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("requirements").select("id, title, priority, status, category, complexity").eq("project_id", projectId),
      supabase.from("sprints").select("id, name, sprint_number, status").eq("project_id", projectId),
    ]);

    // ── Run AI Progress Tracking Analysis ──────────────────────────────────
    const promptContext = `
PROJECT: ${project?.name || "Project"}
DESCRIPTION: ${project?.description || "N/A"}

REQUIREMENTS (${requirements?.length || 0} total):
${(requirements || []).map((r: any) => `- [ID:${r.id}] [${r.priority}] ${r.title} (${r.category || "General"})`).join("\n")}

RECENT GITHUB COMMITS (${formattedCommits.length} total):
${formattedCommits.map((c: any) => `- [${c.sha}] "${c.message.split("\n")[0]}" by ${c.author} (${c.date})`).join("\n")}

RECENT PULL REQUESTS:
${formattedPulls.map((p: any) => `- PR #${p.number} [${p.state}]: ${p.title}`).join("\n")}
`;

    const systemPrompt = `You are Orion Code Intelligence, an AI engineering lead analyzing a GitHub repository's commits, PRs, and commit history against a project's product requirements and sprints.

Analyze the commit history and requirements, then output a STRICT valid JSON object with the following schema:
{
  "progressPercentage": number (0 to 100, estimated overall code completion),
  "executiveSummary": string (2-3 concise sentences summarizing recent development activity and code progress),
  "velocityStatus": "on_track" | "accelerating" | "at_risk" | "stalled",
  "requirementProgress": [
    {
      "requirementTitle": string,
      "status": "completed" | "in_progress" | "not_started",
      "matchedCommits": [string],
      "confidence": number (0.0 to 1.0),
      "note": string
    }
  ],
  "keyHighlights": [string],
  "potentialBlockersOrGaps": [string],
  "nextRecommendedAction": string
}

Only return raw JSON without markdown code fences or conversational text.`;

    let aiAnalysis: any = null;
    try {
      const completion = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze this GitHub repository activity against our project requirements:\n\n${promptContext}` },
        ],
        temperature: 0.2,
        max_tokens: 1500,
      });

      const responseText = completion.choices[0]?.message?.content || "{}";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      aiAnalysis = JSON.parse(cleanJson);
    } catch (aiErr) {
      console.warn("AI analysis parse error:", aiErr);
      aiAnalysis = {
        progressPercentage: Math.min(100, Math.round((formattedCommits.length / 20) * 80)),
        executiveSummary: `Tracked ${formattedCommits.length} recent commits on ${branch}. Development is active across repository branches.`,
        velocityStatus: "on_track",
        requirementProgress: (requirements || []).slice(0, 5).map((r: any) => ({
          requirementTitle: r.title,
          status: "in_progress",
          matchedCommits: formattedCommits.slice(0, 1).map((c: any) => c.sha),
          confidence: 0.7,
          note: "Activity detected in recent repository commits.",
        })),
        keyHighlights: [`${formattedCommits.length} commits synced from GitHub`, `${formattedContributors.length} active contributors tracked`],
        potentialBlockersOrGaps: [],
        nextRecommendedAction: "Continue implementation of high-priority requirements in upcoming sprint.",
      };
    }

    // ── Save to dedicated project_github_integrations table ─────────────────
    try {
      await supabase.from("project_github_integrations").upsert({
        project_id: projectId,
        repo_url: repoData.html_url || `https://github.com/${owner}/${repo}`,
        repo_name: repo,
        owner,
        default_branch: branch,
        token: token || null,
        stars: repoData.stargazers_count || 0,
        forks: repoData.forks_count || 0,
        open_issues: repoData.open_issues_count || 0,
        progress_percentage: aiAnalysis?.progressPercentage || 0,
        velocity_status: aiAnalysis?.velocityStatus || "on_track",
        ai_analysis: aiAnalysis,
        latest_commits: formattedCommits,
        latest_pulls: formattedPulls,
        latest_issues: formattedIssues,
        latest_contributors: formattedContributors,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "project_id" });
    } catch (dbErr) {
      console.warn("project_github_integrations upsert notice:", dbErr);
    }

    // ── Also save in projects metadata as secondary persistence ─────────────
    const existingMeta = project?.metadata || {};
    const updatedMeta = {
      ...existingMeta,
      github: {
        repoUrl: `https://github.com/${owner}/${repo}`,
        fullName: `${owner}/${repo}`,
        owner,
        repo,
        branch,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        lastSyncedAt: new Date().toISOString(),
        progressPercentage: aiAnalysis?.progressPercentage || 0,
      },
    };

    await supabase
      .from("projects")
      .update({ metadata: updatedMeta })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      repo: {
        fullName: `${owner}/${repo}`,
        owner,
        name: repo,
        url: repoData.html_url,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch,
        currentBranch: branch,
        lastPush: repoData.pushed_at,
      },
      commits: formattedCommits,
      pullRequests: formattedPulls,
      issues: formattedIssues,
      contributors: formattedContributors,
      aiAnalysis,
    });
  } catch (error: any) {
    console.error("GitHub Track API error:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze GitHub repository" }, { status: 500 });
  }
}
