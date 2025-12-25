import { useQuery, useMutation } from '@tanstack/react-query';
import { aiApi } from '../api/ai-api';

export function useAIHealthCheck() {
	return useQuery({
		queryKey: ['ai', 'health'],
		queryFn: () => aiApi.healthCheck(),
		staleTime: 30 * 1000, // 30 seconds
	});
}

export function useGenerateEmbedding() {
	return useMutation({
		mutationFn: (text: string) => aiApi.generateEmbedding(text),
	});
}

export function useBatchGenerateEmbeddings() {
	return useMutation({
		mutationFn: ({ texts, batchSize }: { texts: string[]; batchSize?: number }) =>
			aiApi.batchGenerateEmbeddings(texts, batchSize),
	});
}

export function useAnalyzeRoom() {
	return useMutation({
		mutationFn: (description: string) => aiApi.analyzeRoomDescription(description),
	});
}

export function useAIChat() {
	return useMutation({
		mutationFn: ({ message, context }: { message: string; context?: string }) =>
			aiApi.chat(message, context),
	});
}
