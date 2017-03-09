// MIT © 2017 azu
"use strict";

/**
 * @type {boolean}
 */
const withDevTools = (
    // process.env.NODE_ENV === 'development' &&
    typeof window !== 'undefined' && window.devToolsExtension
);

const DefaultDevToolsOptions = {
    features: {
        pause: true, // start/pause recording of dispatched actions
        lock: true, // lock/unlock dispatching actions and side effects
        persist: false, // persist states on page reloading
        export: true, // export history of actions in a file
        import: 'almin-log', // import history of actions from a file
        jump: false, // jump back and forth (time travelling)
        skip: false, // skip (cancel) actions
        reorder: false, // drag and drop actions in the history list
        dispatch: false, // dispatch custom actions or action creators
        test: true // generate tests for the selected actions
    }
};

module.exports = class AlminDevTools {
    /**
     * @param {Context} alminContext
     */
    constructor(alminContext) {
        this.devTools = undefined;
        this.alminContext = alminContext;
    }

    /**
     * connect to devTools
     * @param {Object} options redux-devtools-extension options
     * @see http://extension.remotedev.io/docs/API/Arguments.html
     */
    connect(options = DefaultDevToolsOptions) {
        if (!withDevTools) {
            return;
        }
        this.devTools = window.devToolsExtension.connect(options);
        /*
            will
            execute
            did
            complete
                onChange store
                 log

         */
        let currentDispatching = [];
        this.alminContext.onDispatch((payload, meta) => {
            currentDispatching.push(payload);
        });
        this.alminContext.onDidExecuteEachUseCase((payload, meta) => {
            if (currentDispatching.length > 0) {
                const currentState = this.alminContext.getState();
                currentDispatching.forEach(payload => {
                    this.devTools.send(payload.type, currentState);
                });
            }
            currentDispatching = [];
        });
        this.alminContext.onCompleteEachUseCase((payload, meta) => {
            requestAnimationFrame(() => {
                this.devTools.send(`UseCase:${meta.useCase.name}`, this.alminContext.getState());
            });
        });
    }

    /**
     * initialize state
     * @param {*} state
     */
    init(state = this.alminContext.getState()) {
        if (!withDevTools) {
            return;
        }
        this.devTools.init(state);
    }

    /**
     * register subscribe handler to devTools
     * @param {function(message: Object)} handler
     * @returns {function()} unsubscribe function
     */
    subscribe(handler) {
        return this.devTools.subscribe(handler);
    }

    /**
     * @param {*} action
     * @param {*} state
     * @see http://extension.remotedev.io/docs/API/Methods.html
     */
    send(action, state) {
        if (!withDevTools) {
            return;
        }
        this.devTools.send(action, state);
    }

    /**
     * @param {*} message
     * @see http://extension.remotedev.io/docs/API/Methods.html
     */
    error(message) {
        if (!withDevTools) {
            return;
        }
        this.devTools.error(message);
    }

    /**
     * disconnect to devTools
     */
    disconnect() {
        if (!withDevTools) {
            return;
        }
        this.devTools.disconnect();
    }
};