export interface EventCreationData {
    mode: 'casual' | 'competitive';
    challengeType: string;
    difficulty: string;
    hostUserId: number;
    streamUrl: string;
}