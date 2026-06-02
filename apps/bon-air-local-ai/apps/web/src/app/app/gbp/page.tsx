import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GbpPostForm } from "@/components/gbp/gbp-post-form";
import { GbpPublishButton } from "@/components/gbp/gbp-publish-button";

export const metadata = { title: "GBP Posts" };

export default async function GbpPage() {
  const { tenant } = await getTenantContext();
  if (!tenant) return null;

  const [locations, posts] = await Promise.all([
    prisma.businessLocation.findMany({
      where: { tenantId: tenant.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.gbpPost.findMany({
      where: { tenantId: tenant.id },
      include: { location: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">GBP Posts</h1>
        <p className="text-slate-600">
          Draft and schedule Google Business Profile posts with AI
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New post</CardTitle>
          </CardHeader>
          <CardContent>
            <GbpPostForm locations={locations} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posts ({posts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-sm text-slate-500">No posts yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map((post) => (
                  <li
                    key={post.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-slate-900">{post.topic}</p>
                        <p className="text-xs text-slate-500">
                          {post.location.name}
                        </p>
                      </div>
                      <Badge
                        variant={
                          post.status === "scheduled" ? "warning" : "default"
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {post.body}
                    </p>
                    {post.scheduledFor && (
                      <p className="mt-2 text-xs text-slate-500">
                        Scheduled:{" "}
                        {format(post.scheduledFor, "MMM d, yyyy h:mm a")}
                      </p>
                    )}
                    <GbpPublishButton postId={post.id} status={post.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
