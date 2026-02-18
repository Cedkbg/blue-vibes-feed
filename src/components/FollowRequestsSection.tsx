import { useFollowRequests } from "@/hooks/useFollowRequests";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, UserPlus, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FollowRequestsSection = () => {
  const { pendingRequests, isLoading, acceptRequest, declineRequest } = useFollowRequests();
  const navigate = useNavigate();

  if (isLoading || pendingRequests.length === 0) return null;

  return (
    <div className="px-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-sm">
          Demandes d'abonnement ({pendingRequests.length})
        </h3>
      </div>
      <div className="space-y-2">
        {pendingRequests.map((req) => (
          <Card key={req.id} className="overflow-hidden">
            <CardContent className="p-3 flex items-center gap-3">
              <button onClick={() => navigate(`/profile/${req.requester_id}`)}>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.profile?.avatar_url || ""} />
                  <AvatarFallback>
                    {req.profile?.display_name?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {req.profile?.display_name || req.profile?.username || "Utilisateur"}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Souhaite vous suivre
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3"
                  onClick={() => acceptRequest(req.id, req.requester_id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3"
                  onClick={() => declineRequest(req.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
