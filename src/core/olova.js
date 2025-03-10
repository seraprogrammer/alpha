/**
 * Symbol used to represent a Fragment in the virtual DOM.
 * @type {Symbol}
 */
const Fragment = Symbol("Fragment");

/**
 * @type {function | null}
 */
let currentEffect;

/**
 * Creates a signal with an initial value.
 * A signal is a reactive value that can be subscribed to.
 *
 * @param {*} initialValue - The initial value of the signal.
 * @returns {[function, function]} - An array containing the getter and setter functions for the signal.
 */
const setSignal = (initialValue) => {
  /**
   * @type {Set<function>}
   */
  const subscribers = new Set();
  return [
    /**
     * Getter function for the signal.
     * @returns {*} - The current value of the signal.
     */
    () => {
      try {
        if (currentEffect) subscribers.add(currentEffect);
        return initialValue;
      } catch (error) {
        console.error("Error in signal getter:", error);
        throw error;
      }
    },
    /**
     * Setter function for the signal.
     * @param {*} newValue - The new value to set for the signal. It can be a value or a function that receives the current value and returns the new value.
     * @returns {*} - The updated value of the signal.
     */
    (newValue) => {
      try {
        initialValue =
          typeof newValue === "function" ? newValue(initialValue) : newValue;
        [...subscribers].forEach((subscriberFunction) => {
          try {
            subscriberFunction();
          } catch (error) {
            console.error("Error in signal subscriber:", error);
          }
        });
        return initialValue;
      } catch (error) {
        console.error("Error in signal setter:", error);
        throw error;
      }
    },
  ];
};

/**
 * Creates an effect that runs when its dependencies change.
 * An effect is a function that is executed when the signals it depends on change.
 *
 * @param {function} effectFunction - The function to execute as the effect.
 * @returns {void}
 */
const setEffect = (effectFunction) => {
  const runEffect = () => {
    try {
      currentEffect = runEffect;
      const result = effectFunction();
      currentEffect = null;
      return result;
    } catch (error) {
      currentEffect = null;
      console.error("Error in effect:", error);
      throw error;
    }
  };
  try {
    runEffect();
  } catch (error) {
    console.error("Error initializing effect:", error);
  }
};

/**
 * Creates a memoized value that only updates when its dependencies change.
 *
 * @param {function} memoFunction - The function to calculate the memoized value.
 * @returns {function} - A function that returns the memoized value.
 */
const setMemo = (memoFunction) => {
  try {
    const [getMemoValue, setMemoValue] = setSignal();
    setEffect(() => {
      try {
        setMemoValue(memoFunction());
      } catch (error) {
        console.error("Error in memo function:", error);
        throw error;
      }
    });
    return getMemoValue;
  } catch (error) {
    console.error("Error creating memo:", error);
    return () => undefined;
  }
};

/**
 * Enhanced html function for creating DOM elements.  Supports JSX-style syntax.
 *
 * @param {string|function} tagName - The tag name of the element to create, or a function component.
 * @param {object} properties - An object containing the properties to set on the element.
 * @param {...any} children - The children to append to the element.
 * @returns {HTMLElement|DocumentFragment|Comment} - The created DOM element, fragment, or a comment in case of error.
 */
const html = (tagName, properties, ...children) => {
  try {
    // Handle function components
    if (typeof tagName === "function") {
      try {
        return tagName(properties, ...children);
      } catch (error) {
        console.error(`Error in function component:`, error);
        return document.createComment(`Error in component: ${error.message}`);
      }
    }

    // Support fragments with Fragment symbol or null/undefined tag
    if (tagName === Fragment || !tagName) {
      const documentFragment = document.createDocumentFragment();
      children.flat(Infinity).forEach((child) => {
        if (child !== null && child !== undefined) {
          documentFragment.appendChild(
            child instanceof Node
              ? child
              : document.createTextNode(String(child))
          );
        }
      });
      return documentFragment;
    }

    const SVG_TAGS = new Set([
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polygon",
      "polyline",
      "ellipse",
      "g",
      "text",
      "defs",
      "filter",
      "mask",
      "marker",
      "pattern",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "clipPath",
      "textPath",
      "tspan",
      "foreignObject",
    ]);

    const isSvgElement = SVG_TAGS.has(tagName);

    const element = isSvgElement
      ? document.createElementNS("http://www.w3.org/2000/svg", tagName)
      : document.createElement(tagName);

    if (properties) {
      for (const [propertyName, propertyValue] of Object.entries(properties)) {
        if (propertyValue === null || propertyValue === undefined) continue;

        if (propertyName === "value") {
          element.value = propertyValue;
        } else if (propertyName === "className" || propertyName === "class") {
          element.setAttribute("class", propertyValue);
        } else if (
          propertyName === "style" &&
          typeof propertyValue === "object"
        ) {
          Object.entries(propertyValue).forEach(([styleName, styleValue]) => {
            element.style[styleName] = styleValue;
          });
        } else if (
          propertyName === "dangerouslySetInnerHTML" &&
          propertyValue.__html
        ) {
          element.innerHTML = propertyValue.__html;
        } else if (propertyName === "ref") {
          if (typeof propertyValue === "function") propertyValue(element);
          else if (propertyValue && "current" in propertyValue)
            propertyValue.current = element;
        } else if (propertyName.startsWith("on")) {
          const eventName = propertyName.slice(2).toLowerCase();
          element.addEventListener(eventName, propertyValue);
        } else if (isSvgElement) {
          if (propertyName.includes(":")) {
            const [namespace, attrName] = propertyName.split(":");
            const namespaceMap = {
              xlink: "http://www.w3.org/1999/xlink",
              xml: "http://www.w3.org/XML/1998/namespace",
            };
            if (namespaceMap[namespace]) {
              element.setAttributeNS(
                namespaceMap[namespace],
                attrName,
                propertyValue
              );
            } else {
              element.setAttribute(propertyName, propertyValue);
            }
          } else {
            element.setAttribute(propertyName, propertyValue);
          }
        } else {
          if (typeof propertyValue === "boolean") {
            if (propertyValue) element.setAttribute(propertyName, "");
            else element.removeAttribute(propertyName);
          } else {
            element.setAttribute(propertyName, propertyValue);
          }
        }
      }
    }

    const appendChild = (parentElement, childElement) => {
      try {
        if (childElement === null || childElement === undefined) return;

        if (Array.isArray(childElement)) {
          childElement
            .flat(Infinity)
            .forEach((nestedChild) => appendChild(parentElement, nestedChild));
          return;
        }

        if (childElement instanceof Node) {
          parentElement.appendChild(childElement);
        } else if (typeof childElement === "function") {
          const placeholderNode = document.createTextNode("");
          parentElement.appendChild(placeholderNode);

          setEffect(() => {
            try {
              const functionResult = childElement();
              if (functionResult === null || functionResult === undefined) {
                placeholderNode.textContent = "";
                return;
              }

              if (Array.isArray(functionResult)) {
                const resultFragment = document.createDocumentFragment();
                functionResult.flat(Infinity).forEach((resultItem) => {
                  if (resultItem !== null && resultItem !== undefined) {
                    resultFragment.appendChild(
                      resultItem instanceof Node
                        ? resultItem
                        : document.createTextNode(String(resultItem))
                    );
                  }
                });

               
                while (placeholderNode.nextSibling) {
                  parentElement.removeChild(placeholderNode.nextSibling);
                }

                parentElement.insertBefore(
                  resultFragment,
                  placeholderNode.nextSibling
                );
              } else if (functionResult instanceof Node) {
                
                while (placeholderNode.nextSibling) {
                  parentElement.removeChild(placeholderNode.nextSibling);
                }
                parentElement.insertBefore(
                  functionResult,
                  placeholderNode.nextSibling
                );
              } else {
                placeholderNode.textContent = String(functionResult);
              }
            } catch (error) {
              console.error("Error in reactive child function:", error);
              placeholderNode.textContent = `Error: ${error.message}`;
            }
          });
        } else if (
          typeof childElement === "object" &&
          "then" in childElement &&
          typeof childElement.then === "function"
        ) {
         
          const placeholderNode = document.createTextNode("");
          parentElement.appendChild(placeholderNode);

          childElement
            .then((promiseResult) => {
              try {
                if (promiseResult instanceof Node) {
                  parentElement.replaceChild(promiseResult, placeholderNode);
                } else {
                  placeholderNode.textContent = String(promiseResult);
                }
              } catch (error) {
                console.error("Error resolving promise in DOM:", error);
                placeholderNode.textContent = `Error: ${error.message}`;
              }
            })
            .catch((error) => {
              console.error("Promise rejected in DOM:", error);
              placeholderNode.textContent = `Error: ${error.message}`;
            });
        } else {
          parentElement.appendChild(
            document.createTextNode(String(childElement))
          );
        }
      } catch (error) {
        console.error("Error appending child:", error);
      }
    };

    children.forEach((child) => appendChild(element, child));
    return element;
  } catch (error) {
    console.error("Error creating element:", error);
    return document.createComment(`Error creating element: ${error.message}`);
  }
};

/**
 * Renders a component into a root element.
 * This function is responsible for mounting the virtual DOM into the actual DOM.
 * It handles function components, direct elements, and arrays of nodes.
 * It also provides options for clearing the existing content, hydrating, and executing a beforeRender hook.
 *
 * @param {function|HTMLElement} component - The component to render. Can be a function component or a direct element.
 * @param {HTMLElement|string} rootElement - The root element to render the component into. Can be an HTMLElement or a selector string.
 * @param {object} [options={}] - Optional parameters.
 * @param {boolean} [options.clear=true] - Whether to clear the existing content of the root element before rendering.
 * @param {boolean} [options.hydrate=false] - Whether to hydrate the existing content of the root element.
 * @param {function} [options.beforeRender=null] - A function to execute before rendering.
 * @returns {HTMLElement|DocumentFragment|null} - The rendered element or fragment, or null in case of error.
 */
const render = (component, rootElement, options = {}) => {
  try {
    // If rootElement is a string, treat it as a selector
    if (typeof rootElement === "string") {
      rootElement = document.querySelector(rootElement);
      if (!rootElement) {
        console.error(`Cannot find element matching selector: ${rootElement}`);
        return;
      }
    }

    // Options with defaults
    const { clear = true, hydrate = false, beforeRender = null } = options;

    // Clear existing content if requested
    if (clear && !hydrate) {
      rootElement.textContent = "";
    }

    // Call optional beforeRender hook
    if (beforeRender && typeof beforeRender === "function") {
      try {
        beforeRender(rootElement);
      } catch (error) {
        console.error("Error in beforeRender hook:", error);
      }
    }

    // Handle both function components and direct elements
    let viewContent;
    try {
      viewContent = typeof component === "function" ? component() : component;
    } catch (error) {
      console.error("Error rendering component:", error);
      const errorNode = document.createElement("div");
      errorNode.className = "olova-error";
      errorNode.textContent = `Render Error: ${error.message}`;
      rootElement.appendChild(errorNode);
      return errorNode;
    }

    if (!viewContent) return null;

    // Handle multiple nodes (when component returns an array)
    if (Array.isArray(viewContent)) {
      const contentFragment = document.createDocumentFragment();
      viewContent.flat(Infinity).forEach((node) => {
        if (node) {
          contentFragment.appendChild(
            node instanceof Node ? node : document.createTextNode(String(node))
          );
        }
      });
      rootElement.appendChild(contentFragment);
      return contentFragment;
    }

    // Handle single node
    rootElement.appendChild(
      viewContent instanceof Node
        ? viewContent
        : document.createTextNode(String(viewContent))
    );

    return viewContent;
  } catch (error) {
    console.error("Error in render function:", error);
    return null;
  }
};

// Helper for creating ref objects
const setRef = () => {
  let current = null;
  return (element) => {
    if (element !== undefined) current = element;
    return current;
  };
};

/**
 * Executes a function after the component has been mounted to the DOM.
 * This is similar to `componentDidMount` in React.
 *
 * @param {function} mountFunction - The function to execute after the component is mounted.
 * @returns {void}
 */
const onMount = (mountFunction) => {
  setEffect(() => {
    // Wait for next microtask to ensure DOM is ready
    queueMicrotask(() => {
      try {
        mountFunction();
      } catch (error) {
        console.error("Error in onMount callback:", error);
      }
    });
  });
};

/**
 * Executes a function when the component is unmounted from the DOM.
 * This is similar to `componentWillUnmount` in React.
 *
 * @param {function} cleanupFunction - The function to execute when the component is unmounted.
 *  This function can be used to clean up resources like timers or event listeners.
 * @returns {void}
 */
const onUnmount = (cleanupFunction) => {
  setEffect(() => {
    return () => {
      try {
        cleanupFunction();
      } catch (error) {
        console.error("Error in onUnmount cleanup:", error);
      }
    };
  });
};

/**
 * Exports the API for the Olova library.
 * @module Olova
 */
export {
  setSignal,
  setEffect,
  setMemo,
  setRef,
  html,
  render,
  onMount,
  onUnmount,
  Fragment,
};
