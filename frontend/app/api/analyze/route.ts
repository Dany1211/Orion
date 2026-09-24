import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY environment variable is not configured" }, { status: 500 });
    }

    const supabase = (await createClient()) as any;

    // 1. Fetch project details
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found in workspace" }, { status: 404 });
    }

    // 2. Fetch requirement sources upload history
    const { data: sources, error: sourcesErr } = await supabase
      .from("requirement_sources")
      .select("title, source_type, raw_text")
      .eq("project_id", projectId);

    if (sourcesErr || !sources || sources.length === 0) {
      return NextResponse.json({ error: "Please upload at least one requirements document source first!" }, { status: 400 });
    }

    const combinedTexts = sources
      .map((s: any) => `Document Title: ${s.title}\nType: ${s.source_type}\nContent:\n${s.raw_text}\n---`)
      .join("\n\n");

    // 3. Trigger Groq API Call
    const systemPrompt = `You are Orion's Requirement Intelligence AI Agent. Your job is to parse unstructured software requirement specifications, transcripts, and emails, and transform them into a normalized JSON workspace schema.

    You must output a strict JSON object with this schema:
    {
      "project_overview": {
        "summary": "Brief executive summary of the system.",
        "domain": "E.g. Fintech, Healthcare, E-Commerce, etc.",
        "target_users": "E.g. Customers, managers, admins.",
        "core_problem": "Summary of the business problem.",
        "proposed_solution": "Architecture overview solution."
      },
      "business_objectives": [
        {
          "title": "Short title",
          "description": "Details",
          "priority": "critical" | "high" | "medium" | "low",
          "measurable_outcome": "Outcome metric"
        }
      ],
      "assumptions": ["Assumption 1", "Assumption 2"],
      "constraints": ["Constraint 1", "Constraint 2"],
      "dependencies": [
        {
          "name": "Dependency name",
          "type": "E.g. third_party_api, database, cloud_infrastructure",
          "description": "Details",
          "is_critical": true
        }
      ],
      "technology_recommendations": [
        {
          "layer": "E.g. Frontend, Backend, Database",
          "recommended": "E.g. Next.js, Postgres",
          "rationale": "Why chosen",
          "alternatives": ["Alt 1"]
        }
      ],
      "requirements": [
        {
          "req_type": "functional" | "non_functional",
          "category": "E.g. Security, Auth, Billing",
          "title": "Clear requirement title",
          "description": "Detailed functional behavior",
          "acceptance_criteria": ["Criteria 1", "Criteria 2"],
          "priority": "critical" | "high" | "medium" | "low",
          "complexity": "simple" | "medium" | "complex",
          "estimated_effort_hours": 12
        }
      ],
      "sprints": [
        {
          "name": "Sprint 1 — Core Architecture Setup",
          "sprint_number": 1,
          "goal": "Build baseline security & database models.",
          "status": "active",
          "velocity_points": 12
        }
      ],
      "risks": [
        {
          "title": "Risk title",
          "description": "Details",
          "category": "technical" | "timeline" | "compliance",
          "level": "critical" | "high" | "medium" | "low",
          "probability": 0.5,
          "impact": 0.7,
          "mitigation_strategy": "Mitigation steps"
        }
      ],
      "ai_insights": [
        {
          "severity": "warning" | "error" | "info" | "success",
          "title": "Ambiguity alert or scope creep warning",
          "description": "Specific finding in requirements.",
          "metric_label": "E.g. 3 gaps found",
          "action_label": "Review"
        }
      ]
    }

    Return ONLY the raw JSON object conforming to this schema. No explanation or markdown wrapping.`;

    // NOTE: Groq deprecated llama-3.3-70b-versatile, llama-3.1-8b-instant,
    // qwen/qwen3-32b, and meta-llama/llama-4-scout-17b-16e-instruct on
    // 2026-06-17 (developer/free tier). llama3-70b-8192 and
    // mixtral-8x7b-32768 were decommissioned even earlier. Use the current
    // recommended models instead. Check https://console.groq.com/docs/deprecations
    // periodically, since Groq's lineup changes fairly often.
    let groqResponse;
    let modelUsed = "";
    const models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"];
    let lastError = "";

    for (const model of models) {
      try {
        groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Here is the combined specifications text for Project "${project.name}":\n\n${combinedTexts}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
          })
        });

        if (groqResponse.ok) {
          modelUsed = model;
          break;
        } else {
          lastError = await groqResponse.text();
          console.warn(`Groq Model ${model} run failed, trying next fallback. Error:`, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Groq Fetch for model ${model} failed:`, lastError);
      }
    }

    if (!groqResponse || !groqResponse.ok) {
      return NextResponse.json({ error: `Groq LLM Query Failed: ${lastError || "Unknown connection error"}` }, { status: 502 });
    }

    const completion = await groqResponse.json();
    const resultJson = JSON.parse(completion.choices[0].message.content);

    // 4. Write data to Supabase tables
    // Clear old runs data if any to keep workspace clean
    await supabase.from("project_intelligence").delete().eq("project_id", projectId);
    await supabase.from("requirements").delete().eq("project_id", projectId);
    await supabase.from("sprints").delete().eq("project_id", projectId);
    await supabase.from("risks").delete().eq("project_id", projectId);
    await supabase.from("ai_insights").delete().eq("project_id", projectId);

    // Insert analysis run logs
    const { data: run, error: runErr } = await supabase
      .from("analysis_runs")
      .insert({
        project_id: projectId,
        triggered_by: project.created_by,
        status: "completed",
        model_used: modelUsed,
      })
      .select()
      .single();

    if (runErr || !run) {
      return NextResponse.json({ error: "Failed to initialize database analysis run" }, { status: 500 });
    }

    // A. Insert Project Intelligence
    await supabase.from("project_intelligence").insert({
      project_id: projectId,
      analysis_run_id: run.id,
      project_overview: resultJson.project_overview,
      business_objectives: resultJson.business_objectives,
      assumptions: resultJson.assumptions,
      constraints: resultJson.constraints,
      dependencies: resultJson.dependencies,
      technology_recommendations: resultJson.technology_recommendations
    });

    // B. Insert Requirements
    // B. Insert Requirements
    if (resultJson.requirements && resultJson.requirements.length > 0) {
      const requirementsToInsert = resultJson.requirements.map((req: any) => {
        let reqType = String(req.req_type || "functional").toLowerCase().trim();
        if (reqType.includes("non")) reqType = "non_functional";
        else reqType = "functional";

        let priority = String(req.priority || "medium").toLowerCase().trim();
        if (!["critical", "high", "medium", "low"].includes(priority)) priority = "medium";

        let complexity = String(req.complexity || "medium").toLowerCase().trim();
        if (!["simple", "medium", "complex"].includes(complexity)) complexity = "medium";

        return {
          project_id: projectId,
          analysis_run_id: run.id,
          req_type: reqType,
          category: req.category || "General",
          title: req.title || "Untitled Requirement",
          description: req.description || "No description provided.",
          acceptance_criteria: Array.isArray(req.acceptance_criteria) ? req.acceptance_criteria : [],
          priority: priority,
          status: "confirmed",
          complexity: complexity,
          estimated_effort_hours: Number(req.estimated_effort_hours) || 8
        };
      });
      await supabase.from("requirements").insert(requirementsToInsert);
    }

    // C. Insert Sprints
    if (resultJson.sprints && resultJson.sprints.length > 0) {
      const sprintsToInsert = resultJson.sprints.map((s: any) => {
        let status = String(s.status || "active").toLowerCase().trim();
        if (!["planned", "active", "completed", "cancelled"].includes(status)) status = "active";

        return {
          project_id: projectId,
          name: s.name || `Sprint ${s.sprint_number}`,
          sprint_number: Number(s.sprint_number) || 1,
          goal: s.goal || "Sprint cycle iteration goal.",
          status: status,
          velocity_points: Number(s.velocity_points) || 10
        };
      });
      await supabase.from("sprints").insert(sprintsToInsert);
    }

    // D. Insert Risks
    if (resultJson.risks && resultJson.risks.length > 0) {
      const risksToInsert = resultJson.risks.map((r: any) => {
        let category = String(r.category || "technical").toLowerCase().trim();
        if (!["technical", "resource", "scope", "timeline", "external", "security"].includes(category)) category = "technical";

        let level = String(r.level || "medium").toLowerCase().trim();
        if (!["low", "medium", "high", "critical"].includes(level)) level = "medium";

        return {
          project_id: projectId,
          title: r.title || "Timeline Blocker Risk Threat",
          description: r.description || "Underspecified architectural component dependency.",
          category: category,
          level: level,
          probability: Number(r.probability) || 0.5,
          impact: Number(r.impact) || 0.5,
          mitigation_strategy: r.mitigation_strategy || "Conduct detailed technical evaluation spike."
        };
      });
      await supabase.from("risks").insert(risksToInsert);
    }

    // E. Insert Dashboard AI Insights
    if (resultJson.ai_insights && resultJson.ai_insights.length > 0) {
      const insightsToInsert = resultJson.ai_insights.map((ins: any) => {
        let severity = String(ins.severity || "info").toLowerCase().trim();
        if (severity === "success") severity = "opportunity";
        if (severity === "error" || severity === "critical") severity = "critical";
        if (!["info", "warning", "critical", "opportunity"].includes(severity)) severity = "info";

        let category = String(ins.category || "scope").toLowerCase().trim();
        if (!["scope", "risk", "ambiguity", "opportunity", "dependency", "effort"].includes(category)) {
          // Fall back based on title matching
          if (ins.title?.toLowerCase().includes("ambiguity") || ins.description?.toLowerCase().includes("ambiguity")) category = "ambiguity";
          else if (ins.title?.toLowerCase().includes("risk") || ins.description?.toLowerCase().includes("risk")) category = "risk";
          else category = "scope";
        }

        return {
          project_id: projectId,
          severity: severity,
          category: category,
          title: ins.title || "AI Insight Finding",
          description: ins.description || "Continuous requirements parsing observation details.",
          metric_label: ins.metric_label || "Active Info",
          action_label: ins.action_label || "Review"
        };
      });
      await supabase.from("ai_insights").insert(insightsToInsert);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Critical API Analysis error:", error);
    return NextResponse.json({ error: error.message || "Failed during requirements analysis run" }, { status: 500 });
  }
}