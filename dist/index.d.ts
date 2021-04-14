import * as React from "react";
export interface LinkedState<T> {
    readonly value: T;
    update(v: T): void;
}
export declare function binding<S>(state: [S, React.Dispatch<React.SetStateAction<S>>]): LinkedState<S>;
export declare type PropsType<T extends React.ComponentType<any>> = (T extends React.ComponentClass<infer P, any> ? P : T extends React.FunctionComponent<infer P> ? P : never);
export interface BindingPropsInfo<CompType extends React.ComponentType<any>, updateEP extends (keyof PropsType<CompType>)> {
    key: (keyof PropsType<CompType>);
    updateEventnName?: updateEP;
    getter?(...args: any[]): any;
}
declare class CLS<C extends React.ComponentType<any>> {
    private c;
    constructor(c: C);
    nowList: any[];
    build(): C;
    bind<keyT extends (keyof PropsType<C>), updateEP extends (keyof PropsType<C>)>(key: keyT, updateEventName: updateEP, getter: ((v: Parameters<PropsType<C>[updateEP]>[0]) => PropsType<C>[keyT])): CLS<React.ComponentType<Omit<PropsType<C>, keyT>>>;
}
export declare function pack<CompType extends React.ComponentType<any>>(c: CompType): CLS<CompType>;
export declare function bindingPack<T extends React.ComponentType<any>>(Comp: T, bindKeys: (BindingPropsInfo<T, any> | (keyof PropsType<T>))[]): (props: any) => JSX.Element;
export {};
