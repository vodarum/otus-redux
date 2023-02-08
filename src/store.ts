export type Reducer<State, Action> = (
  state: State | undefined,
  action: Action
) => State;

export type Store<State = any, Action = { type: string }> = {
  getState(): State;
  dispatch(action: Action): void;
  replaceReducer(reducer: Reducer<State, Action>): void;
  subscribe(cb: () => void): () => void;
};

export type Middleware<State, Action> = (
  store: Store<State, Action>
) => (next: (action: Action) => any) => (action: Action) => any;

export type ConfigureStore<State, Action> = (
  reducer: Reducer<State, Action>,
  initialState?: State | undefined,
  middlewares?: Middleware<State, Action>[]
) => Store<State, Action>;

function createStore<State, Action>(
  reducer: Reducer<State, Action>,
  state: State = {} as State
) {
  const subscribes: Set<() => Record<string, never>> = new Set();

  return {
    state,
    getState: () => state,
    dispatch: (action: Action) => {
      state = reducer(state, action); // eslint-disable-line no-param-reassign

      subscribes.forEach((sub) => sub());
    },
    subscribe: (fn: () => Record<string, never>) => {
      subscribes.add(fn);

      return () => subscribes.delete(fn);
    },
    replaceReducer: (newReducer: Reducer<State, Action>) => {
      reducer = newReducer; // eslint-disable-line no-param-reassign
    },
  };
}

type CombineReducer<
  ReducersConfig = any,
  Action = { [key: string]: any }
> = (config: {
  [key in keyof ReducersConfig]: (
    state: ReducersConfig[key] | undefined,
    action: Action
  ) => ReducersConfig[key];
}) => (
  state:
    | {
        [key in keyof ReducersConfig]: ReducersConfig[key];
      }
    | undefined,
  action: Action
) => {
  [key in keyof ReducersConfig]: ReducersConfig[key];
};

const combineReducers: CombineReducer = (config) => (state, action) => {
  const newState = { ...state };
  for (const [key, reducer] of Object.entries(config)) {
    newState[key] = reducer(newState[key], action);
  }
  return newState;
};

function applyMiddleware<State, Action>(
  store: Store<State, Action>,
  middlewares: Array<Middleware<State, Action>>
): Store<State, Action> {
  middlewares = middlewares.slice(); // eslint-disable-line no-param-reassign
  middlewares.reverse();

  let { dispatch } = store;

  middlewares.forEach((middleware) => (dispatch = middleware(store)(dispatch))); // eslint-disable-line no-return-assign
  return { ...store, dispatch };
}

export { createStore, combineReducers, applyMiddleware };
