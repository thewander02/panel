import TransferListener from '@/components/server/TransferListener';
import { Fragment, useEffect, useState } from 'react';
import { NavLink, Route, Routes, useParams } from 'react-router-dom';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import PyroLogo from '@/components/elements/PyroLogo';

function ServerRouter() {
    const params = useParams<'id'>();
    const location = useLocation();

    const rootAdmin = useStoreState(state => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState(state => state.server.data?.id);
    const uuid = ServerContext.useStoreState(state => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState(state => state.server.inConflictState);
    const serverId = ServerContext.useStoreState(state => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions(actions => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions(actions => actions.clearServerState);

    useEffect(
        () => () => {
            clearServerState();
        },
        [],
    );

    useEffect(() => {
        setError('');

        if (params.id === undefined) {
            return;
        }

        getServer(params.id).catch(error => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [params.id]);

    return (
        <Fragment key={'server-router'}>
            {/* <NavigationBar /> */}
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size="large" centered />
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
                                .filter(route => route.path !== undefined)
                                .map(route =>
                                    route.permission ? (
                                        <Can key={route.path} action={route.permission} matchAny>
                                            <NavLink className={'font-bold text-sm py-4'} to={`/server/${id}/${route.path ?? ''}`.replace(/\/$/, '')} end>
                                                {route.name}
                                            </NavLink>
                                        </Can>
                                    ) : (
                                        <NavLink
                                            className={'font-bold text-sm py-4'}
                                            key={route.path}
                                            to={`/server/${id}/${route.path ?? ''}`.replace(/\/$/, '')}
                                            end
                                        >
                                            {route.name}
                                        </NavLink>
                                    ),
                                )}
                            {rootAdmin && (
                                <NavLink to={`/admin/servers/${serverId}`}>
                                    <FontAwesomeIcon icon={faExternalLinkAlt} />
                                </NavLink>
                            )}
                        </div>
                    </div>
                    <InstallListener />
                    <TransferListener />
                    <WebsocketHandler />
                    {inConflictState && (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}/`))) ? (
                        <ConflictStateRenderer />
                    ) : (
                        <ErrorBoundary>
                            <Routes location={location}>
                                {routes.server.map(({ route, permission, component: Component }) => (
                                    <Route
                                        key={route}
                                        path={route}
                                        element={
                                            <PermissionRoute permission={permission}>
                                                <Spinner.Suspense>
                                                    <div data-pyro-routelet style={{
                                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                                        background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.00) 100%)',
                                                    }} className='p-6 h-full w-full overflow-y-auto rounded-xl'>
                                                        <Component />
                                                    </div>
                                                </Spinner.Suspense>
                                            </PermissionRoute>
                                        }
                                    />
                                ))}

                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </ErrorBoundary>
                    )}
                </>
            )}
        </Fragment>
    );
}

export default ServerRouter;
