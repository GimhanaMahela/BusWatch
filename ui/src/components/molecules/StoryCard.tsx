import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface StoryCardProps {
  title: string;
  body: string;
  /** Small labels: category, route, month */
  tags: ReactNode[];
}

/** One resolved case, as published by the team on the impact page. */
function StoryCard({ title, body, tags }: StoryCardProps) {
  return (
    <Card
      component="article"
      sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}
    >
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 3,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "success.main",
            bgcolor: "rgba(var(--mui-palette-success-mainChannel) / 0.12)",
          }}
        >
          <AutoStoriesRoundedIcon />
        </Box>
        <Typography variant="h6" component="h3" sx={{ lineHeight: 1.3 }}>
          {title}
        </Typography>
      </Box>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-line", flex: 1 }}>
        {body}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        {tags.map((tag, i) => (
          <Chip key={i} label={tag} size="small" variant="outlined" />
        ))}
      </Stack>
    </Card>
  );
}

export default StoryCard;
