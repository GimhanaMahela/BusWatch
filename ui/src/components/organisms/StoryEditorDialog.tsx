"use client";

import PrivacyTipRoundedIcon from "@mui/icons-material/PrivacyTipRounded";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/api/apiClient";
import {
  CATEGORIES,
  COMMENDATION_CATEGORIES,
  type ReportCategory,
} from "@/constants/reportConstants";
import { useSaveStory } from "@/hooks/useReportQueries";
import { findPersonalDetails } from "@/lib/personalDetails";
import type { Story, StoryInput } from "@/types/public";

const LANGS = [
  { value: "en", label: "English (required)" },
  { value: "si", label: "සිංහල" },
  { value: "ta", label: "தமிழ்" },
] as const;
type Lang = (typeof LANGS)[number]["value"];

const ALL_CATEGORIES = [
  ...CATEGORIES,
  ...COMMENDATION_CATEGORIES.filter((c) => c.value !== "other"),
];

export type StoryDraft = Partial<StoryInput>;

interface StoryEditorDialogProps {
  open: boolean;
  onClose: () => void;
  /** Story being edited, or the starting values of a new one */
  story: Story | StoryDraft | null;
  /** Receipt ID of the case it is based on, shown for context */
  receiptId?: string | null;
}

const emptyText = { title: "", body: "" };

/** Write or edit a resolved case story, with optional Sinhala and Tamil versions. */
function StoryEditorDialog({ open, onClose, story, receiptId }: StoryEditorDialogProps) {
  const save = useSaveStory();
  const existing = story && "id" in story ? story : null;
  const [lang, setLang] = useState<Lang>("en");
  const [texts, setTexts] = useState<Record<Lang, { title: string; body: string }>>({
    en: { title: story?.title ?? "", body: story?.body ?? "" },
    si: { ...emptyText, ...story?.translations?.si },
    ta: { ...emptyText, ...story?.translations?.ta },
  });
  const [category, setCategory] = useState<ReportCategory | "">(story?.category ?? "");
  const [routeNumber, setRouteNumber] = useState(story?.routeNumber ?? "");
  const [published, setPublished] = useState(story?.published ?? false);

  const setText = (field: "title" | "body", value: string) =>
    setTexts((current) => ({ ...current, [lang]: { ...current[lang], [field]: value } }));

  const allText = Object.values(texts).flatMap((t) => [t.title, t.body]);
  const warnings = findPersonalDetails(...allText);
  const halfTranslated = (["si", "ta"] as const).filter(
    (l) => Boolean(texts[l].title.trim()) !== Boolean(texts[l].body.trim()),
  );

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input: StoryDraft = {
      title: texts.en.title,
      body: texts.en.body,
      translations: { si: texts.si, ta: texts.ta },
      category: category || null,
      routeNumber: routeNumber || null,
      published,
      ...(existing ? {} : { reportId: story?.reportId ?? null }),
    };
    save.mutate({ id: existing?.id, input }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box component="form" onSubmit={submit}>
        <DialogTitle>{existing ? "Edit story" : "New resolved case story"}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2.5 }}>
          <Alert severity="info" icon={<PrivacyTipRoundedIcon />}>
            Stories are public. Describe what changed, not who reported it: no names, receipt IDs,
            contact details or exact times. Example: &ldquo;Route 08 overcharging: the operator
            refunded passengers and retrained conductors.&rdquo;
            {receiptId && (
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                Based on report <strong>{receiptId}</strong> (never shown publicly).
              </Typography>
            )}
          </Alert>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField
                select
                fullWidth
                label="Category (optional)"
                value={category}
                onChange={(e) => setCategory(e.target.value as ReportCategory | "")}
              >
                <MenuItem value="">None</MenuItem>
                {ALL_CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>
                    {c.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                fullWidth
                label="Route (optional)"
                value={routeNumber}
                onChange={(e) => setRouteNumber(e.target.value)}
                slotProps={{ htmlInput: { maxLength: 60 } }}
              />
            </Grid>
          </Grid>

          <Box>
            <Tabs value={lang} onChange={(_, value: Lang) => setLang(value)} sx={{ mb: 2 }}>
              {LANGS.map((l) => (
                <Tab key={l.value} value={l.value} label={l.label} lang={l.value} />
              ))}
            </Tabs>
            <Box sx={{ display: "grid", gap: 2 }} lang={lang}>
              <TextField
                fullWidth
                required={lang === "en"}
                label="Title"
                value={texts[lang].title}
                onChange={(e) => setText("title", e.target.value)}
                slotProps={{ htmlInput: { maxLength: 160 } }}
              />
              <TextField
                fullWidth
                required={lang === "en"}
                multiline
                minRows={4}
                label="What happened and what changed"
                value={texts[lang].body}
                onChange={(e) => setText("body", e.target.value)}
                helperText={
                  lang === "en"
                    ? undefined
                    : "Optional. Readers in this language see the English version until both fields are filled in."
                }
                slotProps={{ htmlInput: { maxLength: 2000 } }}
              />
            </Box>
          </Box>

          {warnings.length > 0 && (
            <Alert severity="warning">
              This text seems to contain {warnings.join(", ")}. Remove it before publishing.
            </Alert>
          )}
          {halfTranslated.length > 0 && (
            <Alert severity="warning">
              The {halfTranslated.map((l) => (l === "si" ? "Sinhala" : "Tamil")).join(" and ")}{" "}
              version needs both a title and a story, or it won&apos;t be shown.
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch checked={published} onChange={(e) => setPublished(e.target.checked)} />
            }
            label={published ? "Published on the impact page" : "Draft (not public)"}
          />
          {save.error && (
            <Alert severity="error">{errorMessage(save.error, "Failed to save the story")}</Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={save.isPending}>
            {existing ? "Save" : published ? "Publish" : "Save draft"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default StoryEditorDialog;
