namespace React {
    export type ReactElement = any;
}

type Record<K extends keyof any, V> = { [_ in K]: V };

export interface Route {
    path: string;
    label: string;
    icon: React.ReactElement;
}

export type Routes = Record<string, Route>;

export interface NestedRoute extends Route {
    children: NestedRoutes;
}

export type NestedRoutes = Record<string, NestedRoute>;

export type GetNestedRouteKey<R extends NestedRoutes> = {
    [key in keyof R]:
    | key
    | keyof R[key]['children']
    | GetNestedRouteKey<R[key]['children']>;
}[keyof R];

// * Example
type A = {
    ideas: {
        path: 'ideas';
        label: 'Discover';
        icon: React.ReactElement;
        children: {
            create: {
                path: 'create';
                label: 'Create';
                icon: React.ReactElement;
                children: {};
            };
            my: {
                path: 'my';
                label: 'My Ideas';
                icon: React.ReactElement;
                children: {
                    published: {
                        path: 'published';
                        label: 'Published';
                        icon: React.ReactElement;
                        children: {};
                    };
                };
            };
        };
    };
};
type B = GetNestedRouteKey<A>; // "ideas" | "create" | "my" | "published"

export type FlattenRoutes<R extends NestedRoutes> = Record<GetNestedRouteKey<R>, Route>; // Type instantiation is excessively deep and possibly infinite.