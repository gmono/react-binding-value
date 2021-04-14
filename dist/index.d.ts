import * as React from "react";
/**
 * 状态连接描述
 * 一个组件可以直接接收它并命名为bind-xxx格式，这样不需要包装可以直接使用
 * 类似vue中的xxx.sync协议
 */
export interface LinkedState<T> {
    readonly value: T;
    update(v: T): void;
}
export declare function binding<S>(state: [S, React.Dispatch<React.SetStateAction<S>>]): LinkedState<S>;
/**
 * 用于bind 对象的成员，这里假设直接修改成员就会触发渲染，并设对应成员有set监听器
 * 自行监听并启动重渲染，多用于useValue 和 mobx store的属性binding
 * @param obj 对象
 * @param key key
 * @returns 一个binding对象
 */
export declare function prop<T, K extends keyof T>(obj: T, key: K): LinkedState<T[K]>;
export declare type PropsType<T extends React.ComponentType<any>> = (T extends React.ComponentClass<infer P, any> ? P : T extends React.FunctionComponent<infer P> ? P : never);
/**
 * 属性转换描述符
 * 用来描述如何把一个非bind属性转换为bind属性
 */
export interface BindingPropsInfo<CompType extends React.ComponentType<any>, updateEP extends (keyof PropsType<CompType>)> {
    key: (keyof PropsType<CompType>);
    updateEventName?: updateEP;
    getter?(...args: any[]): any;
}
export declare function empty(): {
    value: any;
    update(): void;
};
/**
 * 构造者类
 * 为了满足必须类型，这里选择把事件变为可选，而bind的值必须赋值，如果没有，就给与empty赋值
 */
declare class CLS<C extends React.ComponentType<any>> {
    private c;
    constructor(c: C);
    nowList: any[];
    build(): C;
    bind<keyT extends (keyof PropsType<C> & string), updateEP extends (keyof PropsType<C>)>(key: keyT, updateEventName: updateEP, getter: ((v: Parameters<PropsType<C>[updateEP]>[0]) => PropsType<C>[keyT])): CLS<React.ComponentType<Omit<PropsType<C>, keyT | updateEP> & {
        [k in updateEP]?: PropsType<C>[updateEP];
    } & Record<PrefixOr<keyT>, LinkedState<PropsType<C>[keyT]>>>>;
}
/**
 * 包装一个组件允许对其进行属性绑定设置，把非bind属性转换为bind属性（双向binding）
 * @param c 组件
 * @returns 包装器
 */
export declare function pack<CompType extends React.ComponentType<any>>(c: CompType): CLS<CompType>;
declare type PrefixOr<T extends string | number> = `bind-${T}`;
export {};
