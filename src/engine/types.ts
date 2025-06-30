import { GameState } from '@/app/store/gameSlice';
import { ChatResponse } from '@/app/api/chat/types';

export type KeyDownEvent = {
  type: 'keydown';
  key: string;
};

export type ChatResponseEvent = {
  type: 'chatresponse';
  response: ChatResponse;
};

export type TimerElapsedEvent = {
  type: 'timerelapsed';
};

export type GameEvent = KeyDownEvent | ChatResponseEvent | TimerElapsedEvent;

export type StartTimerAction = {
  type: 'start_timer';
  duration: number;
};

export type SendChatRequestAction = {
  type: 'send_chat_request';
  // TODO: add chat request parameters
};

export type AsyncAction = StartTimerAction | SendChatRequestAction;

export type EngineResult = {
  state: GameState;
  actions: AsyncAction[];
};
