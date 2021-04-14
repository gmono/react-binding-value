"use strict";
//双向绑定
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pack = exports.empty = exports.prop = exports.binding = void 0;
//<input value={binding(useState())}
const React = __importStar(require("react"));
function binding(state) {
    //把一个状态打包成link格式
    return {
        get value() {
            return state[0];
        },
        update(v) {
            state[1](v);
        }
    };
}
exports.binding = binding;
/**
 * 用于bind 对象的成员，这里假设直接修改成员就会触发渲染，并设对应成员有set监听器
 * 自行监听并启动重渲染，多用于useValue 和 mobx store的属性binding
 * @param obj 对象
 * @param key key
 * @returns 一个binding对象
 */
function prop(obj, key) {
    let prev = undefined;
    return binding([obj[key], (v) => {
            let vv = null;
            if (v instanceof Function) {
                vv = v(prev);
            }
            else
                vv = v;
            obj[key] = vv;
            //prev
            prev = vv;
        }]);
}
exports.prop = prop;
function empty() {
    return {
        value: null,
        update() { }
    };
}
exports.empty = empty;
/**
 * 构造者类
 * 为了满足必须类型，这里选择把事件变为可选，而bind的值必须赋值，如果没有，就给与empty赋值
 */
class CLS {
    constructor(c) {
        this.c = c;
        this.nowList = [];
    }
    build() {
        return bindingPack(this.c, this.nowList);
    }
    //限制 key必须是string类型 number和symbol暂不支持
    bind(key, updateEventName, getter) {
        this.nowList.push({
            key,
            updateEventName,
            getter
        });
        //在类型中删除key表示的属性
        return this;
    }
}
/**
 * 包装一个组件允许对其进行属性绑定设置，把非bind属性转换为bind属性（双向binding）
 * @param c 组件
 * @returns 包装器
 */
function pack(c) {
    // type Constructor<C>=C extends React.ComponentType<infer P>? (props:P)=>C:never;
    return new CLS(c);
}
exports.pack = pack;
// type test2=ToOr<["1","2"]>
//反向推导函数 把对象转换为key的组合 其中s类型是所有key的组合
function GetKey(args) {
    return null;
}
/**
 * 对一个对象添加前缀
 * @param args 用来确定类型的参数 反向推导
 * @returns null
 */
function PrefixObjKeys(args) {
    return null;
}
//把obj key提取出来 添加前缀 再重新转换成obj
//不能直接使用 可以按照代码自己写来使用
// function prefixObjectKeys<T extends {[idx:string]:any}>(obj:T){
//     let keys=GetKey(obj);
//     return null as PrefixObjectKeys<typeof keys>;
// }
//必须是getkey函数的返回值类型
//此处两行生效
// let aa=GetKey({b:1,c:3});
// type ttt=PrefixObjectKeys<typeof aa>;
function test() {
}
// let t=prefixObjectKeys({a:1});
// type ss=keyof typeof t;
// type s=PrefixTuple<["a","b"]>
//实现从对象到keys的或形式
//添加bind-value 提示，1 获取所有bindkeys中的key，为a|b形式，2 拥有把a|b转换为{a:x,b:x}的形式 3 把a|b转换为bind-a|bind-b
/**
 * 绑定包装 理论上支持多重绑定 即bind-bind-data 来实现自动事件切换
 * @param Comp 组件
 * @param bindKeys key列表或绑定描述列表
 * @returns 高阶组件
 */
function bindingPack(Comp, bindKeys) {
    //将制定的树形添加bind前缀属性
    //传入的是binding数组
    //暂不支持修改前缀（因为要匹配类型设定）
    const prefix = 'bind-';
    let keys = bindKeys.map(v => typeof v == "string" ? { key: v } : v);
    let bkeys = keys.map(v => v.key);
    return (props) => {
        //bind前缀的属性 在keys中的
        let nprops = {};
        for (let k in props) {
            console.log(bkeys);
            if (k.startsWith(prefix) && bkeys.includes(k.slice(prefix.length))) {
                console.log(k);
                //是绑定属性
                //转换
                let rk = k.slice(prefix.length);
                let rv = props[k].value;
                nprops[rk] = rv;
                //添加事件
                //找到与当前属性一样的描述符 获取记录的事件名
                let desc = keys.find(v => v.key == rk);
                //默认使用onChange事件
                let eventname = desc.updateEventName ?? "onChange";
                //添加事件
                console.log('aaa');
                function addEvent() {
                    nprops[eventname].funcs.push((...args) => {
                        //绑定事件 用来调用更新函数
                        let ent = props[k];
                        let val = args[0];
                        if (desc.getter != null) {
                            //有定义 提取
                            val = desc.getter(...args);
                        }
                        ent.update(val);
                    });
                }
                if (eventname in nprops) {
                    //已经有这个事件
                    addEvent();
                }
                else {
                    let hubfunc = (...args) => {
                        for (let a of hubfunc.funcs) {
                            //忽略返回值
                            a(...args);
                        }
                    };
                    hubfunc.funcs = [];
                    //nprops
                    nprops[eventname] = hubfunc;
                    //
                    addEvent();
                }
            }
            else {
                if (typeof props[k] == "function") {
                    if (k in nprops) {
                        //这里确定一定是函数了
                        if (typeof nprops[k] != "function") {
                            throw new Error();
                        }
                        else
                            nprops[k].funcs.push(props[k]);
                    }
                    else {
                        //创建集线器
                        let eventname = k;
                        let hubfunc = (...args) => {
                            for (let a of hubfunc.funcs) {
                                //忽略返回值
                                a(...args);
                            }
                        };
                        hubfunc.funcs = [];
                        //nprops
                        nprops[eventname] = hubfunc;
                        hubfunc.funcs.push(props[k]);
                    }
                }
                else {
                    if (k in nprops)
                        throw new Error("重复使用值属性");
                    nprops[k] = props[k];
                }
            }
        }
        console.log(nprops);
        return React.createElement(Comp, Object.assign({}, nprops));
    };
}
