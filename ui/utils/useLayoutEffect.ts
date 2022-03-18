import { useLayoutEffect as useReactLayoutEffect } from "react";
import isServerSide from "@utils/isServerSide";

let useLayoutEffect = useReactLayoutEffect;

if (isServerSide()) {
    useLayoutEffect = () => {};
}

export default useLayoutEffect;
