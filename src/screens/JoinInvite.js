import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { AppIcon } from '@/components/ui/Logo777';
import { useAuth } from '@/context/auth';
import { useStore } from '@/context/store';
import * as repo from '@/lib/db/repo';
import s from './JoinInvite.module.css';
/**
 * What the partner sees when they open the link.
 *
 * The whole point is that they arrive already knowing whose space this is, so
 * the inviter's name is fetched before anyone signs in — through peek_invite,
 * which is the only thing a stranger holding a code is allowed to learn.
 */
export default function JoinInviteScreen() {
    const { code = '' } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { refresh, coupleId } = useStore();
    const [inviter, setInviter] = useState(null);
    const [open, setOpen] = useState(null);
    const [error, setError] = useState(null);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);
    useEffect(() => {
        let alive = true;
        repo
            .peekInvite(code)
            .then((row) => {
            if (!alive)
                return;
            if (!row) {
                setError('That invite link does not match a Couple777 space.');
                return;
            }
            setInviter(row.inviter_name || 'Someone');
            setOpen(row.is_open);
        })
            .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
        return () => {
            alive = false;
        };
    }, [code]);
    /*
     * Someone who already has a space has nothing to join here.
     *
     * The guard matters: joining sets coupleId, so without it this effect fires
     * the instant the join succeeds and bounces you home — over the top of the
     * short setup the join was supposed to lead to.
     */
    useEffect(() => {
        if (coupleId && !joined)
            navigate('/', { replace: true });
    }, [coupleId, joined, navigate]);
    const join = async () => {
        setJoining(true);
        setError(null);
        try {
            await repo.joinCoupleByCode(code);
            setJoined(true);
            await refresh();
            // Straight to the short personal setup: nothing the first partner
            // already answered gets asked again.
            navigate('/me/setup', { replace: true });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
        finally {
            setJoining(false);
        }
    };
    if (error) {
        return (_jsx(Screen, { className: s.screen, children: _jsxs("div", { className: s.center, children: [_jsx("h1", { className: s.title, children: "This invite did not work" }), _jsx("p", { className: s.body, children: error }), _jsx(Button, { variant: "secondary", block: true, onClick: () => navigate('/', { replace: true }), children: "Go to Couple777" })] }) }));
    }
    return (_jsx(Screen, { className: s.screen, children: _jsxs("div", { className: s.center, children: [_jsx(AppIcon, { tone: "on-accent", className: s.icon }), _jsxs("h1", { className: s.title, children: [inviter ? `${inviter} invited you to Couple777` : 'You have been invited', " \u2764\uFE0F"] }), _jsx("p", { className: s.body, children: "A private space for the two of you." }), open === false ? (_jsxs("p", { className: s.body, children: ["This space already has two people in it. Ask ", inviter ?? 'them', " to check."] })) : authLoading ? null : user ? (_jsx(Button, { variant: "accent", size: "lg", block: true, disabled: joining, onClick: () => void join(), children: joining ? 'Joining…' : `Join ${inviter ?? 'them'}` })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { variant: "accent", size: "lg", block: true, onClick: () => navigate(`/account?next=${encodeURIComponent(`/join/${code}`)}`), children: ["Join ", inviter ?? 'them'] }), _jsx("p", { className: s.fine, children: "You will make your own account. Your private notes stay yours." })] }))] }) }));
}
