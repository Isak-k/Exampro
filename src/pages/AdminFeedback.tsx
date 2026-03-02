import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send } from "lucide-react";
import { collection, getDocs, query, orderBy, limit, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/client";

export default function AdminFeedback() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<Array<any>>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [replies, setReplies] = useState<Array<any>>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const loadReplies = useCallback(async (messageId: string) => {
    setLoadingReplies(true);
    try {
      const q = query(
        collection(db, "studentFeedback", messageId, "replies"),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setReplies(data);
    } catch (e) {
      console.error(e);
      setReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "studentFeedback"), orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setFeedback(items);
      if (items.length > 0) {
        setSelected(items[0]);
        loadReplies(items[0].id);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    try {
      setSending(true);
      await addDoc(collection(db, "studentFeedback", selected.id, "replies"), {
        message: reply.trim(),
        createdAt: Timestamp.now(),
        authorRole: "admin",
      });
      setReply("");
      toast({ title: "Reply sent" });
      loadReplies(selected.id);
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message || "Try again", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in max-w-6xl">
        <div className="flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold">Feedback</h1>
            <p className="text-muted-foreground mt-1">Review student messages and reply</p>
          </div>
          <Button variant="outline" onClick={fetchFeedback}>Refresh</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Inbox
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
              {loading ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : feedback.length === 0 ? (
                <div className="text-sm text-muted-foreground">No messages yet.</div>
              ) : (
                feedback.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelected(m);
                      loadReplies(m.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg border hover:bg-muted transition ${
                      selected?.id === m.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="font-medium">{m.fullName} <span className="text-xs text-muted-foreground">({m.email})</span></div>
                    <div className="text-sm line-clamp-2">{m.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">{m.createdAt?.toDate?.().toLocaleString?.() || ""}</div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Thread</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selected ? (
                <>
                  <div className="p-3 rounded-lg border bg-muted/50 whitespace-pre-wrap">
                    <div className="text-xs text-muted-foreground mb-2">Student message:</div>
                    {selected.message}
                  </div>
                  
                  {/* Display Replies */}
                  {loadingReplies ? (
                    <div className="text-sm text-muted-foreground">Loading replies...</div>
                  ) : replies.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Conversation:</div>
                      {replies.map((r) => (
                        <div
                          key={r.id}
                          className={`p-3 rounded-lg border ${
                            r.authorRole === "admin"
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200"
                              : "bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {r.authorRole === "admin" ? "You (Admin)" : "Student"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {r.createdAt?.toDate?.().toLocaleString?.() || ""}
                            </span>
                          </div>
                          <div className="text-sm whitespace-pre-wrap">{r.message}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No replies yet.</div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Reply</Label>
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Write a reply to the student..."
                      rows={4}
                    />
                    <div className="flex justify-end">
                      <Button onClick={sendReply} disabled={sending || !reply.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-sm text-muted-foreground">Select a message to reply.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
