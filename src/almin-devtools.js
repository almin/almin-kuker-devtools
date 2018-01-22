// MIT © 2017 azu
"use strict";

const sendToDevTools = ({ type, state }) => {
    console.log({ type, state });
    window.postMessage({
        kuker: true,
        type: type,
        origin: 'Almin',
        label: type,
        time: (new Date()).getTime(),
        state: { state },
        icon: 'fa-money',
        color: '#bada55'
    }, '*');
};
/**
 * This connect from Almin's context to DevTools
 *
 * - If the state is changed by dispatching
 *   - When anyone payload is dispatched and the UseCase did executed, send to devTools.
 *   - When anyone payload is dispatched and the state is changed, send to devTools
 * - If the state is changed by UseCase
 *   - When anyone UseCase is completed, send to devTools
 *
 * @param {Context} alminContext
 */
const contextToDevTools = (alminContext) => {
    /**
     * @type {Object[]}
     */
    let currentDispatching = [];
    const sendDispatched = () => {
        if (currentDispatching.length > 0) {
            const currentState = alminContext.getState();
            currentDispatching.forEach(payload => {
                sendToDevTools({
                    type: payload.type,
                    state: currentState
                });
            });
            currentDispatching = [];
        }
    };
    alminContext.events.onDispatch((payload, meta) => {
        currentDispatching.push(payload);
    });
    alminContext.onChange(() => {
        sendDispatched()
    });
    alminContext.events.onBeginTransaction((payload, meta) => {
        sendToDevTools({
            type: `Transaction Begin:${meta.transaction.name}`,
            state: alminContext.getState()
        })
    });
    alminContext.events.onEndTransaction((payload, meta) => {
        sendToDevTools({
            type: `Transaction End:${meta.transaction.name}`,
            state: alminContext.getState()
        });
    });

    alminContext.events.onDidExecuteEachUseCase(() => {
        sendDispatched();
    });
    alminContext.events.onCompleteEachUseCase((payload, meta) => {
        requestAnimationFrame(() => {
            sendToDevTools({
                type: `UseCase:${meta.useCase.name}`,
                state: alminContext.getState()
            });
        });
    });
    alminContext.events.onErrorDispatch((payload) => {
        sendToDevTools({
            type: "Error",
            state: alminContext.getState()
        });
    });
};


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
        this.alminContext = alminContext;
        contextToDevTools(this.alminContext);
    }
};
