import React, { Suspense, lazy } from 'react';
// import { hot } from 'react-hot-loader/root';
import { Route, Router, Routes } from 'react-router-dom';
import { CompatRouter } from "react-router-dom-v5-compat";
import { StoreProvider } from 'easy-peasy';
import { store } from '@/state';
import { SiteSettings } from '@/state/settings';
import ProgressBar from '@/components/elements/ProgressBar';
import { NotFound } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import GlobalStylesheet from '@/assets/css/GlobalStylesheet';
import { history } from '@/components/history';
import { setupInterceptors } from '@/api/interceptors';
import AuthenticatedRoute from '@/components/elements/AuthenticatedRoute';
import { ServerContext } from '@/state/server';
import '@/assets/tailwind.css';
import Spinner from '@/components/elements/Spinner';

const DashboardRouter = lazy(() => import(/* webpackChunkName: "dashboard" */ '@/routers/DashboardRouter'));
const ServerRouter = lazy(() => import(/* webpackChunkName: "server" */ '@/routers/ServerRouter'));
const AuthenticationRouter = lazy(() => import(/* webpackChunkName: "auth" */ '@/routers/AuthenticationRouter'));

interface ExtendedWindow extends Window {
    SiteConfiguration?: SiteSettings;
    PterodactylUser?: {
        uuid: string;
        username: string;
        email: string;
        /* eslint-disable camelcase */
        root_admin: boolean;
        use_totp: boolean;
        language: string;
        updated_at: string;
        created_at: string;
        /* eslint-enable camelcase */
    };
}

setupInterceptors(history);

const App = () => {
    const { PterodactylUser, SiteConfiguration } = window as ExtendedWindow;
    if (PterodactylUser && !store.getState().user.data) {
        store.getActions().user.setUserData({
            uuid: PterodactylUser.uuid,
            username: PterodactylUser.username,
            email: PterodactylUser.email,
            language: PterodactylUser.language,
            rootAdmin: PterodactylUser.root_admin,
            useTotp: PterodactylUser.use_totp,
            createdAt: new Date(PterodactylUser.created_at),
            updatedAt: new Date(PterodactylUser.updated_at),
        });
    }

    if (!store.getState().settings.data) {
        store.getActions().settings.setSettings(SiteConfiguration!);
    }

    return (
        <>
            <GlobalStylesheet />
            <StoreProvider store={store}>
                <main data-pyro-main className='pyro-main flex flex-row gap-2 w-full h-full'>
                    <Router history={history}>
                        <CompatRouter>
                        {/* Ideally routes should transition fast enough to not require a spinner.
                        Maybe a timeout for 5 seconds before showing a spinner? Also it's just ugly */}
                        <Routes>
                            <Route path={'/auth'}>
                                {/* <Spinner.Suspense> */}
                                <Suspense fallback={<></>}>
                                    <AuthenticationRouter />
                                </Suspense>
                                {/* </Spinner.Suspense> */}
                            </Route>
                            <AuthenticatedRoute path={'/server/:id'}>
                                {/* <Spinner.Suspense> */}
                                <Suspense fallback={<></>}>
                                    <ServerContext.Provider>
                                        <ServerRouter />
                                    </ServerContext.Provider>
                                </Suspense>
                                {/* </Spinner.Suspense> */}
                            </AuthenticatedRoute>
                            <AuthenticatedRoute path={'/'}>
                                {/* <Spinner.Suspense> */}
                                <Suspense fallback={<></>}>
                                    <DashboardRouter />
                                </Suspense>
                                {/* </Spinner.Suspense> */}
                            </AuthenticatedRoute>
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                        </CompatRouter>
                    </Router>
                </main>
            </StoreProvider>
        </>
    );
};

export default hot(App);
