import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { airbnbUrl, bookingUrl, mapsUrl, restaurantUrl } from '@/lib/share';
import s from './PlanningHelpers.module.css';
const OUT = (_jsx("svg", { viewBox: "0 0 24 24", width: "12", height: "12", "aria-hidden": true, className: s.out, children: _jsx("path", { d: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round" }) }));
function Out({ href, children }) {
    return (_jsxs("a", { className: s.link, href: href, target: "_blank", rel: "noopener noreferrer", children: [children, OUT] }));
}
/**
 * Somewhere to keep going, not somewhere to book. These are plain search links
 * opened in a new tab — Couple777 stays the ritual, and the travel sites stay
 * the travel sites.
 */
export function PlanningHelpers({ tier, destination, }) {
    const where = destination?.trim();
    if (!where)
        return null;
    if (tier === 'day') {
        return (_jsxs("div", { className: s.block, children: [_jsx("p", { className: s.label, children: "Getting there" }), _jsxs("div", { className: s.row, children: [_jsx(Out, { href: restaurantUrl(where), children: "\uD83C\uDF7D Find a restaurant" }), _jsx(Out, { href: mapsUrl(where), children: "\uD83D\uDCCD Open in Maps" })] })] }));
    }
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: s.block, children: [_jsx("p", { className: s.label, children: "Stay" }), _jsxs("div", { className: s.row, children: [_jsx(Out, { href: bookingUrl(where), children: "Search Booking.com" }), _jsx(Out, { href: airbnbUrl(where), children: "Search Airbnb" })] }), _jsxs("p", { className: s.note, children: ["Opens a search for ", where, ". Nothing is booked from here."] })] }), _jsxs("div", { className: s.block, children: [_jsx("p", { className: s.label, children: "Getting there" }), _jsx("div", { className: s.row, children: _jsx(Out, { href: mapsUrl(where), children: "\uD83D\uDCCD Open in Maps" }) })] })] }));
}
