import { useState, useEffect } from "react";
import { Hash, Users, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type FilterType = "all" | "personal" | "channel" | "group" | "community";

interface EntityOption {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FeedFilterProps {
  selectedType: FilterType;
  selectedEntityId: string | null;
  onFilterChange: (type: FilterType, entityId: string | null) => void;
}

export const FeedFilter = ({
  selectedType,
  selectedEntityId,
  onFilterChange,
}: FeedFilterProps) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<EntityOption[]>([]);
  const [groups, setGroups] = useState<EntityOption[]>([]);
  const [communities, setCommunities] = useState<EntityOption[]>([]);
  const [showEntityPicker, setShowEntityPicker] = useState<FilterType | null>(null);

  useEffect(() => {
    const fetchEntities = async () => {
      // Fetch subscribed channels
      const { data: channelsData } = await supabase
        .from("channels")
        .select("id, name, avatar_url")
        .order("name");
      
      if (channelsData) setChannels(channelsData);

      // Fetch groups user is member of
      if (user) {
        const { data: memberGroups } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", user.id);

        if (memberGroups && memberGroups.length > 0) {
          const groupIds = memberGroups.map((m) => m.group_id);
          const { data: groupsData } = await supabase
            .from("groups")
            .select("id, name, avatar_url")
            .in("id", groupIds);
          
          if (groupsData) setGroups(groupsData);
        }

        // Fetch communities user is member of
        const { data: memberCommunities } = await supabase
          .from("community_members")
          .select("community_id")
          .eq("user_id", user.id);

        if (memberCommunities && memberCommunities.length > 0) {
          const communityIds = memberCommunities.map((m) => m.community_id);
          const { data: communitiesData } = await supabase
            .from("communities")
            .select("id, name, avatar_url")
            .in("id", communityIds);
          
          if (communitiesData) setCommunities(communitiesData);
        }
      }
    };

    fetchEntities();
  }, [user]);

  const handleTypeClick = (type: FilterType) => {
    if (type === "all" || type === "personal") {
      onFilterChange(type, null);
      setShowEntityPicker(null);
    } else {
      setShowEntityPicker(showEntityPicker === type ? null : type);
    }
  };

  const handleEntitySelect = (type: FilterType, entityId: string) => {
    onFilterChange(type, entityId);
    setShowEntityPicker(null);
  };

  const getSelectedEntityName = () => {
    if (!selectedEntityId) return null;
    
    const allEntities = [...channels, ...groups, ...communities];
    return allEntities.find((e) => e.id === selectedEntityId)?.name || null;
  };

  const getEntitiesForType = (type: FilterType): EntityOption[] => {
    switch (type) {
      case "channel":
        return channels;
      case "group":
        return groups;
      case "community":
        return communities;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-2">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <Button
            variant={selectedType === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleTypeClick("all")}
          >
            Tout
          </Button>
          <Button
            variant={selectedType === "personal" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleTypeClick("personal")}
          >
            Personnel
          </Button>
          <Button
            variant={selectedType === "channel" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1"
            onClick={() => handleTypeClick("channel")}
          >
            <Hash className="w-3.5 h-3.5" />
            Chaînes
          </Button>
          <Button
            variant={selectedType === "group" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1"
            onClick={() => handleTypeClick("group")}
          >
            <Users className="w-3.5 h-3.5" />
            Groupes
          </Button>
          <Button
            variant={selectedType === "community" ? "default" : "outline"}
            size="sm"
            className="rounded-full gap-1"
            onClick={() => handleTypeClick("community")}
          >
            <Users className="w-3.5 h-3.5" />
            Communautés
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Selected entity badge */}
      {selectedEntityId && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5 pr-1">
            {getSelectedEntityName()}
            <button
              onClick={() => onFilterChange(selectedType, null)}
              className="ml-1 hover:bg-muted rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </div>
      )}

      {/* Entity picker dropdown */}
      {showEntityPicker && (
        <div className="bg-card border rounded-lg p-2 shadow-lg max-h-48 overflow-y-auto">
          {getEntitiesForType(showEntityPicker).length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-2">
              Aucun{showEntityPicker === "channel" ? "e chaîne" : showEntityPicker === "group" ? " groupe" : "e communauté"}
            </p>
          ) : (
            <div className="space-y-1">
              {getEntitiesForType(showEntityPicker).map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => handleEntitySelect(showEntityPicker, entity.id)}
                  className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-sm"
                >
                  {entity.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
