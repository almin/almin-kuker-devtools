// MIT © 2017 azu
"use strict";

const Color = {
    system: "#33ccff",
    user: "#009933",
    error: "#cc0033"
};
const sendToDevTools = ({ type, label, state, color }) => {
    window.postMessage({
        kuker: true,
        type: type,
        origin: 'Almin',
        label: label || type,
        time: (new Date()).getTime(),
        state: { state },
        icon: 'fa-link',
        color: color
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
const connectToDevTools = (alminContext) => {
    const listeners = [];
    /**
     * @type {Object[]}
     */
    let currentDispatching = [];
    const convertLabel = (type) => {

    };
    const sendDispatched = () => {
        if (currentDispatching.length > 0) {
            const currentState = alminContext.getState();
            currentDispatching.forEach(payload => {
                sendToDevTools({
                    type: payload.type,
                    label: payload.label,
                    state: currentState,
                    color: Color.user
                });
            });
            currentDispatching = [];
        }
    };
    listeners.push(
        alminContext.events.onDispatch((payload, meta) => {

            currentDispatching.push({
                type: payload.type,
                label: `${meta.useCase.name} update Store`
            });
        })
    );
    listeners.push(
        alminContext.onChange(() => {
            sendDispatched();
        })
    );
    listeners.push(
        alminContext.events.onBeginTransaction((payload, meta) => {
            sendToDevTools({
                type: `Transaction Begin:${meta.transaction.name}`,
                state: alminContext.getState(),
                color: Color.system
            })
        })
    );
    listeners.push(
        alminContext.events.onEndTransaction((payload, meta) => {
            sendToDevTools({
                type: `Transaction End:${meta.transaction.name}`,
                state: alminContext.getState(),
                color: Color.system
            });
        })
    );
    listeners.push(
        alminContext.events.onWillExecuteEachUseCase((payload, meta) => {
            sendToDevTools({
                type: `Start UseCase:${meta.useCase.name}`,
                state: alminContext.getState(),
                color: Color.system
            });
        })
    );
    listeners.push(
        alminContext.events.onDidExecuteEachUseCase(() => {
            sendDispatched();
        })
    );
    listeners.push(
        alminContext.events.onCompleteEachUseCase((payload, meta) => {
            requestAnimationFrame(() => {
                sendToDevTools({
                    type: `Finish UseCase:${meta.useCase.name}`,
                    state: alminContext.getState(),
                    color: Color.system
                });
            });
        })
    );
    listeners.push(
        alminContext.events.onErrorDispatch((payload) => {
            sendToDevTools({
                type: "Error",
                state: alminContext.getState(),
                color: Color.error
            });
        })
    );
    return () => {
        listeners.forEach(listener => listener());
    }
};


export class AlminKukerDevTools {
    constructor(alminContext) {
    }

    /**
     * @param {Context} alminContext
     */
    connect(alminContext) {
        this.releaseHandler = connectToDevTools(alminContext);
    }

    disconnect() {
        if (typeof this.releaseHandler === "function") {
            this.releaseHandler();
        }
    }
}
