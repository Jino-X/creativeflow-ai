'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Upload, MessageSquare, History } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiGet, apiPost, getErrorMessage } from '@/lib/api';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  TYPE_LABELS,
  fullName,
} from '@/lib/labels';
import type { RequestDetail, Comment, Asset, AiEnrichment, RequestStatus } from '@/lib/types';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const requestId = params.id as string;

  const [transitionNote, setTransitionNote] = useState('');
  const [selectedTransition, setSelectedTransition] = useState<RequestStatus | ''>('');
  const [commentBody, setCommentBody] = useState('');

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', requestId],
    queryFn: () => apiGet<RequestDetail>(`/requests/${requestId}`),
  });

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', requestId],
    queryFn: () => apiGet<Comment[]>(`/requests/${requestId}/comments`),
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets', requestId],
    queryFn: () => apiGet<Asset[]>(`/requests/${requestId}/assets`),
  });

  const transitionMutation = useMutation({
    mutationFn: (data: { toStatus: RequestStatus; note?: string }) =>
      apiPost(`/requests/${requestId}/transition`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      toast.success('Status updated');
      setSelectedTransition('');
      setTransitionNote('');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const enrichMutation = useMutation({
    mutationFn: () => apiPost<AiEnrichment>(`/ai/requests/${requestId}/enrich`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      toast.success('Request enriched with AI');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const commentMutation = useMutation({
    mutationFn: (body: string) =>
      apiPost(`/requests/${requestId}/comments`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', requestId] });
      setCommentBody('');
      toast.success('Comment added');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!request) {
    return <p className="py-12 text-center text-muted-foreground">Request not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <p className="text-muted-foreground">
            {TYPE_LABELS[request.type]} • Created{' '}
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={STATUS_COLORS[request.status]}>{STATUS_LABELS[request.status]}</Badge>
        <Badge className={PRIORITY_COLORS[request.priority]}>
          {PRIORITY_LABELS[request.priority]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{request.description || 'No description provided.'}</p>
            </CardContent>
          </Card>

          {request.aiSummary && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p>{request.aiSummary}</p>
                {request.aiAcceptanceCriteria && request.aiAcceptanceCriteria.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Acceptance Criteria:</p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {request.aiAcceptanceCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="comments">
            <TabsList>
              <TabsTrigger value="comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comments ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="assets">
                <Upload className="h-4 w-4 mr-2" />
                Assets ({assets.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comments" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={!commentBody.trim() || commentMutation.isPending}
                  onClick={() => commentMutation.mutate(commentBody)}
                >
                  Post Comment
                </Button>
              </div>
              {comments.length === 0 ? (
                <p className="text-muted-foreground text-sm">No comments yet.</p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{fullName(comment.author)}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assets" className="mt-4">
              {assets.length === 0 ? (
                <p className="text-muted-foreground text-sm">No assets uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => (
                    <div key={asset.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          v{asset.currentVersion} • {asset.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              {request.statusHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm">No status changes yet.</p>
              ) : (
                <div className="space-y-3">
                  {request.statusHistory.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary" />
                      <div>
                        <p>
                          {entry.fromStatus ? (
                            <>
                              <Badge variant="outline" className="mr-1">
                                {STATUS_LABELS[entry.fromStatus]}
                              </Badge>
                              →
                            </>
                          ) : (
                            'Created as'
                          )}{' '}
                          <Badge className={STATUS_COLORS[entry.toStatus]}>
                            {STATUS_LABELS[entry.toStatus]}
                          </Badge>
                        </p>
                        <p className="text-muted-foreground">
                          {fullName(entry.changedBy)} •{' '}
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                        {entry.note && <p className="mt-1 italic">"{entry.note}"</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Requester</span>
                <span>{fullName(request.requester)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignee</span>
                <span>{fullName(request.assignee)}</span>
              </div>
              {request.campaign && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span>{request.campaign}</span>
                </div>
              )}
              {request.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{request.department}</span>
                </div>
              )}
              {request.dueDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{new Date(request.dueDate).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {request.availableTransitions.length > 0 && (
                <div className="space-y-2">
                  <Select
                    value={selectedTransition}
                    onValueChange={(v) => setSelectedTransition(v as RequestStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Change status..." />
                    </SelectTrigger>
                    <SelectContent>
                      {request.availableTransitions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {STATUS_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTransition && (
                    <>
                      <Textarea
                        placeholder="Add a note (optional)"
                        value={transitionNote}
                        onChange={(e) => setTransitionNote(e.target.value)}
                        rows={2}
                      />
                      <Button
                        className="w-full"
                        disabled={transitionMutation.isPending}
                        onClick={() =>
                          transitionMutation.mutate({
                            toStatus: selectedTransition,
                            note: transitionNote || undefined,
                          })
                        }
                      >
                        Update Status
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!request.aiSummary && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={enrichMutation.isPending}
                  onClick={() => enrichMutation.mutate()}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {enrichMutation.isPending ? 'Enriching...' : 'Enrich with AI'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
