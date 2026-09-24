import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { projectId, messages, clientContext } = await req.json();

    if (!projectId || !messages?.length) {
      return NextResponse.json({ error: "Missing projectId or messages" }, { status: 400 });
    }

    // ── Fetch authenticated project context from Supabase ─────────────────
    const supabase = (await createClient()) as any;

    const [
      { data: projectData, error: projErr },
      { data: intelligenceData },
      { data: requirementsData },
      { data: sprintsData },
      { data: risksData },
      { data: sourcesData },
      { data: orgMembersData },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
      supabase.from("project_intelligence").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("requirements").select("*").eq("project_id", projectId).order("priority").limit(50),
      supabase.from("sprints").select("*").eq("project_id", projectId).order("sprint_number").limit(20),
      supabase.from("risks").select("*").eq("project_id", projectId).limit(20),
      supabase.from("requirement_sources").select("title, source_type, status, extracted_text, word_count, created_at").eq("project_id", projectId).limit(10),
      supabase.from("organization_members").select("role, profiles(full_name, email)").limit(30),
    ]);

    // Fallback / merge with client-provided context if database tables are still populating
    const project = projectData || clientContext?.project || null;
    const intelligence = intelligenceData || clientContext?.intelligence || null;
    const requirements = (requirementsData && requirementsData.length > 0) ? requirementsData : (clientContext?.requirements || []);
    const sprints = (sprintsData && sprintsData.length > 0) ? sprintsData : (clientContext?.sprints || []);
    const risks = (risksData && risksData.length > 0) ? risksData : (clientContext?.risks || []);
    const sources = (sourcesData && sourcesData.length > 0) ? sourcesData : (clientContext?.sources || []);
    const orgMembers = orgMembersData || clientContext?.members || [];

    // ── Build comprehensive project context ───────────────────────────────
    let projectContext = "";
    if (project) {
      projectContext = `
PROJECT NAME: ${project.name}
Domain / Industry: ${project.domain || "Fintech & Banking"}
Status: ${project.status || "Active"}
Tech Stack: ${Array.isArray(project.tech_stack) ? project.tech_stack.join(", ") : (project.tech_stack || "Next.js, TypeScript, Supabase, TailwindCSS")}
Team Size: ${project.team_size || (orgMembers.length ? `${orgMembers.length} member(s)` : "Cross-functional")}
Description: ${project.description || "No description provided"}
${project.metadata?.sprint_cycle ? `Sprint Cycle: ${project.metadata.sprint_cycle}` : ""}
${project.metadata?.github ? `GitHub Connected: ${project.metadata.github.fullName || project.metadata.github.repoUrl} (Branch: ${project.metadata.github.branch || "main"}, Code Progress: ${project.metadata.github.progressPercentage || 0}%, Stars: ${project.metadata.github.stars || 0})` : ""}
`.trim();
    } else {
      projectContext = "Project metadata is being initialized.";
    }

    // Intelligence summary (overview, objectives, constraints)
    let intelligenceContext = "";
    if (intelligence) {
      const overview = typeof intelligence.project_overview === "string" ? intelligence.project_overview : JSON.stringify(intelligence.project_overview || "");
      const objectives = Array.isArray(intelligence.business_objectives) ? intelligence.business_objectives.join(", ") : (typeof intelligence.business_objectives === "object" ? JSON.stringify(intelligence.business_objectives) : intelligence.business_objectives || "");
      const assumptions = Array.isArray(intelligence.assumptions) ? intelligence.assumptions.join("\n- ") : "";
      const constraints = Array.isArray(intelligence.constraints) ? intelligence.constraints.join("\n- ") : "";
      const techRecs = typeof intelligence.technology_recommendations === "object" ? JSON.stringify(intelligence.technology_recommendations) : "";

      intelligenceContext = `
WORKSPACE SCOPE & INTELLIGENCE OVERVIEW:
${overview ? `Summary: ${overview}` : ""}
${objectives ? `Business Objectives: ${objectives}` : ""}
${assumptions ? `Assumptions:\n- ${assumptions}` : ""}
${constraints ? `Constraints:\n- ${constraints}` : ""}
${techRecs ? `Tech Stack Recommendations: ${techRecs}` : ""}
`.trim();
    }

    const requirementsContext = requirements?.length
      ? `\nEXTRACTED REQUIREMENTS (${requirements.length} total):\n` +
        requirements
          .map(
            (r: any, idx: number) =>
              `${idx + 1}. [${(r.priority || "MEDIUM").toUpperCase()}] ${r.title} | Category: ${r.category || r.req_type || "Functional"} | Status: ${r.status || "confirmed"} | Complexity: ${r.complexity || "medium"} | Effort: ${r.estimated_effort_hours || "?"}h\n   Details: ${r.description || ""}`
          )
          .join("\n")
      : "\nNo requirements extracted yet.";

    const sprintsContext = sprints?.length
      ? `\nSPRINT ROADMAP (${sprints.length} total):\n` +
        sprints
          .map((s: any) => `- Sprint ${s.sprint_number || ""}: ${s.name || s.title} (${s.status || "planned"})${s.start_date ? ` [${s.start_date} → ${s.end_date}]` : ""}${s.goal ? ` - Goal: ${s.goal}` : ""}`)
          .join("\n")
      : "\nNo sprints defined yet.";

    const risksContext = risks?.length
      ? `\nTHREAT MATRIX & RISKS (${risks.length} total):\n` +
        risks
          .map((r: any) => `- [${(r.level || r.severity || "MEDIUM").toUpperCase()}] ${r.title}: ${r.description || ""} | Mitigation: ${r.mitigation_strategy || r.mitigation || "N/A"}`)
          .join("\n")
      : "\nNo risks recorded.";

    const sourcesContext = sources?.length
      ? `\nSPECIFICATIONS & DOCUMENTS (${sources.length} total):\n` +
        sources
          .map((s: any) => {
            const preview = s.extracted_text ? ` - Text Snippet: "${s.extracted_text.slice(0, 300).replace(/\n+/g, " ")}..."` : "";
            return `- ${s.title || s.file_name} (${s.source_type || "Document"}, status: ${s.status || "processed"})${preview}`;
          })
          .join("\n")
      : "";

    const teamContext = orgMembers?.length
      ? `\nTEAM & WORKSPACE MEMBERS (${orgMembers.length} total):\n` +
        orgMembers
          .map((m: any) => `- ${m.profiles?.full_name || m.profiles?.email || "Team Member"} (${m.role || "Member"})`)
          .join("\n")
      : `\nTeam Size: ${project?.team_size || "1+ members"}`;

    const systemPrompt = `You are Orion AI, an expert software requirements analyst, solution architect, and project management assistant embedded directly into this project in the Orion platform.

You have full live access to all database specifications for this project:

${projectContext}
${intelligenceContext}
${teamContext}
${requirementsContext}
${sprintsContext}
${risksContext}
${sourcesContext}

Your Responsibilities:
1. Answer any question about this project's requirements, scope, team, specifications, architecture, sprint breakdown, and technical risks.
2. Directly refer to the specifications, documents, and requirements listed above.
3. If asked about team size or members, use the TEAM & WORKSPACE MEMBERS and Project Team Size info provided above.
4. If asked for a summary, provide a clear, professional breakdown of the project overview, key goals, requirements count, and roadmap based on the context.
5. Format your answers neatly using Markdown (bullet points, bold text, clear sections).`;

    // ── Call Groq with streaming ──────────────────────────────────────────
    const model = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    const stream = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      max_tokens: 1500,
      temperature: 0.5,
      stream: true,
    });

    // ── Stream response back to client ────────────────────────────────────
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
