export default function isServerSide() {
    return typeof window === "undefined";
}
