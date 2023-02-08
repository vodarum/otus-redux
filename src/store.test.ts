import { createStore, combineReducers, applyMiddleware } from "./store";

describe("createStore", () => {
  describe("public interface", () => {
    it("is a function", () => {
      expect(createStore).toBeInstanceOf(Function);
    });

    it("generates store with reducer", () => {
      const state = 2;
      const store = createStore(() => state);

      expect(store.getState).toBeInstanceOf(Function);
      expect(store.dispatch).toBeInstanceOf(Function);
      expect(store.replaceReducer).toBeInstanceOf(Function);
      expect(store.subscribe).toBeInstanceOf(Function);
      expect(store.subscribe(jest.fn())).toBeInstanceOf(Function);
    });
  });

  describe("functional interface", () => {
    const action1 = { type: "xxx" };
    const action2 = { type: "yyyy" };

    const reducer = jest.fn((state, action) => {
      switch (action.type) {
        case action1.type:
          return { ...state, count: state.count + 1 };

        case action2.type:
          return { ...state, count: state.count + 2 };

        default:
          return { ...state, count: state.count };
      }
    });

    it("returns state based on initial state", () => {
      const state = { name: "Bob" };

      expect(createStore(() => null).getState()).toEqual({});
      expect(createStore(() => null, state).getState()).toBe(state);
    });

    it("calculates new state with reducer call", () => {
      const store = createStore(reducer, { count: 0 });

      store.dispatch(action1);
      expect(reducer).toHaveBeenCalledWith({ count: 0 }, action1);
      expect(store.getState()).toEqual({ count: 1 });

      store.dispatch(action2);
      expect(reducer).toHaveBeenCalledWith({ count: 1 }, action2);
      expect(store.getState()).toEqual({ count: 3 });
    });

    it("notifies listeners about updates", () => {
      const store = createStore(reducer);

      const spy = jest.fn();

      store.subscribe(spy);
      expect(spy).not.toHaveBeenCalled();

      store.dispatch(action1);
      expect(spy).toHaveBeenCalled();

      store.dispatch(action2);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it("replaces reducer", () => {
      const store = createStore(reducer, { count: 0 });

      store.dispatch(action1);
      expect(reducer).toHaveBeenCalledTimes(1);
      expect(reducer).toHaveBeenCalledWith({ count: 0 }, action1);
      expect(store.getState()).toEqual({ count: 1 });

      const newReducer = jest.fn((state, action) => {
        switch (action.type) {
          case action1.type:
            return { ...state, count: state.count + 10 };

          case action2.type:
            return { ...state, count: state.count + 20 };

          default:
            return { ...state, count: state.count };
        }
      });

      store.replaceReducer(newReducer);

      store.dispatch(action2);
      expect(reducer).toHaveBeenCalledTimes(1);
      expect(newReducer).toHaveBeenCalledWith({ count: 1 }, action2);
      expect(store.getState()).toEqual({ count: 21 });
    });

    it("allows to unsubscribe from the events", () => {
      const store = createStore(reducer);

      const spy = jest.fn();

      const unsubscribe = store.subscribe(spy);

      expect(spy).not.toHaveBeenCalled();

      store.dispatch(action1);
      expect(spy).toHaveBeenCalled();

      unsubscribe();

      store.dispatch(action2);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
});

describe("combineReducers", () => {
  it("is a function", () => {
    expect(combineReducers).toBeInstanceOf(Function);
  });

  it("returns a function", () => {
    expect(combineReducers({})).toBeInstanceOf(Function);
  });

  it("returns a reducer based on the config (initial state)", () => {
    const reducer = combineReducers({
      a: (state = { count: 2 }, action: { [key: string]: any }) => state,
      b: (state = { text: "hop" }, action: { [key: string]: any }) => state,
    });
    expect(reducer(undefined, { type: "unknown" })).toEqual({
      a: { count: 2 },
      b: { text: "hop" },
    });
  });

  it("calls subreducers with proper values", () => {
    type State = { a: number; b: number };
    const config = {
      a: jest.fn((state = 5, action) => state + action.payload),
      b: jest.fn((state = 6, action) => state - action.payload),
    };
    const reducer = combineReducers(config);

    const state: State = {
      a: 55,
      b: 66,
    };
    const action1 = { payload: 1 };
    const newState1 = reducer(state, { payload: 1 });

    expect(config.a).toHaveBeenCalledWith(55, action1);
    expect(config.b).toHaveBeenCalledWith(66, action1);

    expect(newState1).toEqual({
      a: 56,
      b: 65,
    });

    const action2 = { payload: 2 };
    const newState2 = reducer(newState1, action2);
    expect(config.a).toHaveBeenCalledWith(56, action2);
    expect(config.b).toHaveBeenCalledWith(65, action2);
    expect(newState2).toEqual({
      a: 58,
      b: 63,
    });
  });
});

describe("applyMiddleware", () => {
  it("is a function", () => {
    expect(applyMiddleware).toBeInstanceOf(Function);
  });
});
