import TransferListener from '@/components/server/TransferListener';
import React, { Suspense, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import PyroLogo from '@/components/elements/PyroLogo';

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            {/* <NavigationBar /> */}
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    // <Spinner size={'large'} centered />
                    <></>
                )
            ) : (
                <>
                    <div style={{
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(255, 255, 255, 0.06)',
                    }} data-pyro-navigation className='pyro-serverrouter-subnavigation w-[300px] min-w-[300px] rounded-xl p-6 overflow-y-auto overflow-x-hidden'>
                        <div className='pyro-serverrouter-subnavigation-wrapper flex flex-col'>
                            <NavLink to={'/'} end={true}>
                                <PyroLogo />
                            </NavLink>
                            <div className='w-6 h-[1px] my-8' style={{ background: 'rgba(255, 255, 255, 0.19)' }} />
                            {routes.server
                                .filter((route) => !!route.name)
                                .map((route) =>
                                    route.permission ? (
                                        <Can key={route.path} action={route.permission} matchAny>
                                            <NavLink className={`font-bold text-sm py-4 ${({ isActive }) => isActive ? "text-red" : ""}`} to={to(route.path, true)} end={route.exact}>
                                                {route.name}
                                            </NavLink>
                                        </Can>
                                    ) : (
                                        <NavLink className={`font-bold text-sm py-4 ${({ isActive }) => isActive ? "text-red" : ""}`} key={route.path} to={to(route.path, true)} end={route.exact}>
                                            {route.name}
                                        </NavLink>
                                    )
                                )}

                            {/* Why the fuck does this need to exist? */}
                            {/* {rootAdmin && (
                                    // eslint-disable-next-line react/jsx-no-target-blank
                                    <a href={`/admin/servers/view/${serverId}`} target={'_blank'}>
                                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                                    </a>
                            )} */}
                        </div>
                    </div>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <TransitionRouter>
                                <Routes location={location}>
                                    {routes.server.map(({ path, permission, component: Component }) => (
                                        <PermissionRoute key={path} permission={permission} path={to(path)} exact>
                                            {/* <Spinner.Suspense> */}
                                            <div data-pyro-routelet style={{
                                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.00) 100%)',
                                            }} className='p-6 h-full w-full overflow-y-auto rounded-xl'>
                                                {/* <Spinner.Suspense> */}
                                                <Suspense fallback={<></>}>
                                                    <Component />
                                                </Suspense>
                                                {/* </Spinner.Suspense> */}
                                            </div>
                                            {/* </Spinner.Suspense> */}
                                        </PermissionRoute>
                                    ))}
                                    <Route path={'*'} component={NotFound} />
                                </Switch>
                            </TransitionRouter>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </React.Fragment>
    );
};
