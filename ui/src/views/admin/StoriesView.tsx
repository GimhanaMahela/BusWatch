"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { errorMessage } from "@/api/apiClient";
import { EmptyState, LoadingState, PageHeader } from "@/components/molecules";
import { StoryEditorDialog, type StoryDraft } from "@/components/organisms";
import { categoryLabel } from "@/constants/reportConstants";
import { useDeleteStory, useReport, useSaveStory, useStories } from "@/hooks/useReportQueries";
import { timeAgo } from "@/lib/format";
import type { Story } from "@/types/public";

type Editing = { story: Story | StoryDraft; receiptId?: string | null } | null;

/**
 * Resolved case stories for the public impact page: concrete, anonymised proof that reporting
 * changes things. Admins write them, keep drafts, and publish when ready.
 * Opened with ?report=<id> (from a report's page) it starts a story about that case.
 */
function StoriesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromReport = searchParams.get("report") ?? "";
  const stories = useStories();
  const save = useSaveStory();
  const remove = useDeleteStory();
  const sourceReport = useReport(fromReport);
  const [editing, setEditing] = useState<Editing>(null);
  const [toDelete, setToDelete] = useState<Story | null>(null);

  // Start a story about the report this page was opened from, once it has loaded
  const [startedFrom, setStartedFrom] = useState("");
  if (fromReport && sourceReport.data && startedFrom !== fromReport) {
    const report = sourceReport.data;
    setStartedFrom(fromReport);
    setEditing({
      story: {
        reportId: report.id,
        category: report.category,
        routeNumber: report.routeNumber,
        title: `Route ${report.routeNumber}, ${categoryLabel(report.category).toLowerCase()}: `,
        body: "",
        published: false,
      },
      receiptId: report.receiptId,
    });
  }

  const close = () => {
    setEditing(null);
    if (fromReport) router.replace("/admin/stories", { scroll: false });
  };

  return (
    <>
      <PageHeader
        eyebrow="Show the results"
        title="Resolved case stories"
        subtitle="Short, anonymised write-ups of cases that changed something, shown on the public impact page."
        actions={
          <>
            <Button
              href="/impact"
              target="_blank"
              variant="outlined"
              startIcon={<OpenInNewRoundedIcon />}
            >
              Impact page
            </Button>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setEditing({ story: { title: "", body: "", published: false } })}
            >
              New story
            </Button>
          </>
        }
      />

      {stories.isPending && <LoadingState message="Loading stories..." />}
      {(stories.error ?? remove.error ?? save.error) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage(stories.error ?? remove.error ?? save.error, "Something went wrong")}
        </Alert>
      )}

      {stories.data?.length === 0 && (
        <Card>
          <EmptyState
            icon={<AutoStoriesRoundedIcon />}
            title="No stories yet"
            description="Open a resolved report and choose “Write a story”, or start one here."
          />
        </Card>
      )}

      <Stack spacing={2}>
        {stories.data?.map((story) => (
          <Card key={story.id} sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", flexWrap: "wrap" }}>
              <Box sx={{ flex: 1, minWidth: 240 }}>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", mb: 1 }}>
                  <Chip
                    size="small"
                    color={story.published ? "success" : "default"}
                    label={story.published ? "Published" : "Draft"}
                  />
                  {story.category && (
                    <Chip size="small" variant="outlined" label={categoryLabel(story.category)} />
                  )}
                  {story.routeNumber && (
                    <Chip size="small" variant="outlined" label={`Route ${story.routeNumber}`} />
                  )}
                  {Object.keys(story.translations).map((l) => (
                    <Chip
                      key={l}
                      size="small"
                      variant="outlined"
                      label={l === "si" ? "සිංහල" : "தமிழ்"}
                    />
                  ))}
                </Stack>
                <Typography variant="h6" component="h2" sx={{ fontSize: "1.05rem" }}>
                  {story.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, whiteSpace: "pre-line" }}
                >
                  {story.body}
                </Typography>
                <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                  Updated {timeAgo(story.updatedAt)}
                  {story.createdBy ? ` · written by ${story.createdBy}` : ""}
                  {story.receiptId ? ` · based on ${story.receiptId}` : ""}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Tooltip title={story.published ? "Unpublish" : "Publish"}>
                  <Switch
                    checked={story.published}
                    onChange={(e) =>
                      save.mutate({ id: story.id, input: { published: e.target.checked } })
                    }
                    slotProps={{ input: { "aria-label": `Published: ${story.title}` } }}
                  />
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton
                    aria-label={`Edit ${story.title}`}
                    onClick={() => setEditing({ story, receiptId: story.receiptId })}
                  >
                    <EditRoundedIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    aria-label={`Delete ${story.title}`}
                    onClick={() => setToDelete(story)}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Card>
        ))}
      </Stack>

      {editing && (
        <StoryEditorDialog
          open
          story={editing.story}
          receiptId={editing.receiptId}
          onClose={close}
        />
      )}

      <Dialog open={toDelete !== null} onClose={() => setToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this story?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            &ldquo;{toDelete?.title}&rdquo; will be removed
            {toDelete?.published ? " from the impact page" : ""}. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setToDelete(null)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            loading={remove.isPending}
            onClick={() =>
              toDelete && remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) })
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default StoriesView;
