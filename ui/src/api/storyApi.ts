import apiClient, { call } from "@/api/apiClient";
import type { Story, StoryInput } from "@/types/public";

export const listStories = () => call<Story[]>(apiClient.get("/stories"));

export const createStory = (input: StoryInput) => call<Story>(apiClient.post("/stories", input));

export const updateStory = (id: string, input: Partial<StoryInput>) =>
  call<Story>(apiClient.put(`/stories/${id}`, input));

export const deleteStory = (id: string) =>
  call<{ msg: string }>(apiClient.delete(`/stories/${id}`));
