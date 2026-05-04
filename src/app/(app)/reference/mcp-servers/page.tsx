import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, XCircle, MinusCircle, Server } from "lucide-react";
import { MCP_SERVERS, type McpServer } from "@/lib/mcp-servers";

function UsefulIcon({ useful }: { useful: boolean | "partial" }) {
  if (useful === true) return <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  if (useful === "partial") return <MinusCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
  return <XCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />;
}

function StatusBadge({ status }: { status: McpServer["status"] }) {
  if (status === "active")
    return <Badge variant="secondary" className="text-[10px] bg-green-500/15 text-green-600 dark:text-green-400">Active</Badge>;
  if (status === "limited")
    return <Badge variant="secondary" className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400">Limited use</Badge>;
  return <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">No MCP</Badge>;
}

export default function McpServersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">MCP Servers</h1>
        <p className="text-sm text-muted-foreground mt-1">
          MCP servers that can help automate GDPR auditing. Before auditing a new platform, search for
          official MCP servers - the ecosystem moves fast.
        </p>
      </div>

      <Card>
        <CardContent className="py-4">
          <h2 className="text-sm font-semibold mb-3">Priority for setup</h2>
          <ol className="space-y-1.5 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 w-4 shrink-0">1.</span>
              <span><strong>GTM MCP</strong> - highest value. Automates the most manual checks in our audit checklist (A3-A5, B2-B5, H3-H5)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 w-4 shrink-0">2.</span>
              <span><strong>Webflow MCP</strong> - useful for reading and fixing header scripts across client sites</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 w-4 shrink-0">3.</span>
              <span><strong>HubSpot MCP</strong> - skip for now, CRM-only, not relevant to GDPR auditing</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-mono text-xs text-muted-foreground mt-0.5 w-4 shrink-0">4.</span>
              <span><strong>Cookiebot</strong> - no MCP needed, public endpoints are sufficient</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {MCP_SERVERS.map((server) => (
        <Card key={server.name}>
          <CardHeader className="py-4">
            <div className="flex items-center gap-3">
              <Server className="h-4 w-4 text-muted-foreground shrink-0" />
              <CardTitle className="text-sm flex-1">{server.name}</CardTitle>
              {server.official && (
                <Badge variant="secondary" className="text-[10px]">Official</Badge>
              )}
              <StatusBadge status={server.status} />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">{server.description}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
              {server.repo && (
                <a
                  href={server.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  GitHub repo <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {server.docs && (
                <a
                  href={server.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  Documentation <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <span className="text-muted-foreground">Auth: {server.auth}</span>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Capabilities
              </h3>
              <div className="space-y-1.5">
                {server.capabilities.map((cap) => (
                  <div key={cap.name} className="flex items-start gap-2">
                    <UsefulIcon useful={cap.useful} />
                    <div>
                      <span className="text-sm">{cap.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{cap.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {server.notes && server.notes.length > 0 && (
              <div className="rounded-md bg-muted/50 px-3 py-2 space-y-1">
                {server.notes.map((note, i) => (
                  <p key={i} className="text-xs text-muted-foreground">{note}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
