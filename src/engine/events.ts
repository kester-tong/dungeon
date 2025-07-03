import { ChatResponse } from '../apis/types';

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
