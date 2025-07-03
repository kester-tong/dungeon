import { GameState } from '../game/state';

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

