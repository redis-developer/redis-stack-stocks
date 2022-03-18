import useLayoutEffect from "@utils/useLayoutEffect";
import React, { useRef, useContext } from "react";
import { CSSTransition as ReactCSSTransition } from "react-transition-group";

interface TransitionContextParent {
    show?: boolean;
    isInitialRender?: boolean;
    appear?: boolean;
}

const TransitionContext = React.createContext({
  parent: {} as TransitionContextParent,
});

function useIsInitialRender() {
  const isInitialRender = useRef(true);
  useLayoutEffect(() => {
    isInitialRender.current = false;
  }, []);
  return isInitialRender.current;
}

export interface CSSTransitionProps {
    [key: string]: any;
    children?: React.ReactNode;
    show?: boolean;
    enter?: string;
    enterStart?: string;
    enterEnd?: string;
    leave?: string;
    leaveStart?: string;
    leaveEnd?: string;
    appear?: boolean;
    unmountOnExit?: boolean;
    tag?: React.ElementType;
}

function CSSTransition({
  show,
  enter = "",
  enterStart = "",
  enterEnd = "",
  leave = "",
  leaveStart = "",
  leaveEnd = "",
  appear,
  unmountOnExit,
  tag = "div",
  children,
  ...rest
}: CSSTransitionProps) {
  const enterClasses = enter.split(" ").filter((s) => s.length);
  const enterStartClasses = enterStart.split(" ").filter((s) => s.length);
  const enterEndClasses = enterEnd.split(" ").filter((s) => s.length);
  const leaveClasses = leave.split(" ").filter((s) => s.length);
  const leaveStartClasses = leaveStart.split(" ").filter((s) => s.length);
  const leaveEndClasses = leaveEnd.split(" ").filter((s) => s.length);
  const removeFromDom = unmountOnExit;

  function addClasses(node: Element, classes: string[]) {
    classes.length && node.classList.add(...classes);
  }

  function removeClasses(node: Element, classes: string[]) {
    classes.length && node.classList.remove(...classes);
  }

  const nodeRef = React.useRef<HTMLElement>(null);
  const Component = tag;

  return (
    <ReactCSSTransition
      appear={appear}
      nodeRef={nodeRef}
      unmountOnExit={removeFromDom}
      in={show}
      addEndListener={(done) => {
        nodeRef.current?.addEventListener("transitionend", done, false);
      }}
      onEnter={() => {
        if (!removeFromDom && !!nodeRef.current) nodeRef.current.style.display = '';
        addClasses(nodeRef.current as Element, [...enterClasses, ...enterStartClasses]);
      }}
      onEntering={() => {
        removeClasses(nodeRef.current as Element, enterStartClasses);
        addClasses(nodeRef.current as Element, enterEndClasses);
      }}
      onEntered={() => {
        removeClasses(nodeRef.current as Element, [...enterEndClasses, ...enterClasses]);
      }}
      onExit={() => {
        addClasses(nodeRef.current as Element, [...leaveClasses, ...leaveStartClasses]);
      }}
      onExiting={() => {
        removeClasses(nodeRef.current as Element, leaveStartClasses);
        addClasses(nodeRef.current as Element, leaveEndClasses);
      }}
      onExited={() => {
        removeClasses(nodeRef.current as Element, [...leaveEndClasses, ...leaveClasses]);
        if (!removeFromDom && !!nodeRef.current) nodeRef.current.style.display = "none";
      }}
    >
      <Component
        ref={nodeRef}
        {...rest}
        style={{ display: !removeFromDom ? "none" : null }}
      >
        {children}
      </Component>
    </ReactCSSTransition>
  );
}

export interface TransitionProps {
    [key: string]: any;
    show?: boolean;
    appear?: boolean;
}

function Transition({ show, appear, ...rest }: TransitionProps) {
  const { parent } = useContext(TransitionContext);
  const isInitialRender = useIsInitialRender();
  const isChild = show === undefined;

  if (isChild) {
    return (
      <CSSTransition
        appear={parent.appear || !parent.isInitialRender}
        show={parent.show}
        {...rest}
      />
    );
  }

  return (
    <TransitionContext.Provider
      value={{
        parent: {
          show,
          isInitialRender,
          appear,
        },
      }}
    >
      <CSSTransition appear={appear} show={show} {...rest} />
    </TransitionContext.Provider>
  );
}

export default Transition;
