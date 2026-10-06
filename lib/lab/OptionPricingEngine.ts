import { decimal, units, D } from "./decimal";

// Decimal series for the normal CDF. Monetary calculations stay in decimal arithmetic.
function density(x:InstanceType<typeof D>){return x.pow(2).div(-2).exp().div(new D(2).mul(D.acos(-1)).sqrt());}
function normal(x:InstanceType<typeof D>){if(x.abs().gte(9))return new D(x.gt(0)?1:0);let term=x,sum=x;for(let n=1;n<210;n++){term=term.mul(x.pow(2)).div(-2*n);const next=term.div(2*n+1);sum=sum.plus(next);if(next.abs().lt("1e-44"))break;}return D.max(0,D.min(1,new D(.5).plus(sum.div(new D(2).mul(D.acos(-1)).sqrt()))));}
export function blackScholes(spot:string,strike:string,kind:"call"|"put",days:number,volatility:number,rate=0,dividend=0){
 const S=decimal(spot),K=decimal(strike);if(S.lt(0)||K.lte(0)||!Number.isFinite(days)||days<0||!Number.isFinite(volatility)||volatility<=0||volatility>5||!Number.isFinite(rate)||rate<=-1||dividend<0)throw new Error("Parâmetros de opção inválidos.");
 const intrinsic=D.max(0,kind==="call"?S.minus(K):K.minus(S));
 if(days===0)return{premium:units(intrinsic),intrinsic:units(intrinsic),extrinsic:"0",delta:kind==="call"?(S.gt(K)?1:0):(S.lt(K)?-1:0),gamma:0,theta:0,vega:0,rho:0,d1:0,d2:0,days,volatility,rate,dividend};
 if(S.eq(0)){const t=new D(days).div(365),r=new D(1).plus(rate).ln(),discount=r.mul(t).neg().exp(),premium=kind==="put"?K.mul(discount):new D(0);return{premium:units(premium),intrinsic:units(intrinsic),extrinsic:units(premium.minus(intrinsic)),delta:kind==="put"?-new D(dividend).mul(t).neg().exp().toNumber():0,gamma:0,theta:kind==="put"?r.mul(K).mul(discount).div(365).toNumber():0,vega:0,rho:kind==="put"?K.mul(t).mul(discount).div(-100).toNumber():0,d1:-Infinity,d2:-Infinity,days,volatility,rate,dividend};}
 const T=new D(days).div(365),sigma=new D(volatility),r=new D(rate).plus(1).ln(),q=new D(dividend),root=T.sqrt(),d1=S.div(K).ln().plus(r.minus(q).plus(sigma.pow(2).div(2)).mul(T)).div(sigma.mul(root)),d2=d1.minus(sigma.mul(root)),ds=q.mul(T).neg().exp(),dk=r.mul(T).neg().exp(),phi=density(d1),call=kind==="call";
 const premium=call?S.mul(ds).mul(normal(d1)).minus(K.mul(dk).mul(normal(d2))):K.mul(dk).mul(normal(d2.neg())).minus(S.mul(ds).mul(normal(d1.neg())));
 const delta=ds.mul(call?normal(d1):normal(d1).minus(1)),gamma=ds.mul(phi).div(S.mul(sigma).mul(root)),vega=S.mul(ds).mul(phi).mul(root).div(100);
 const decay=S.mul(ds).mul(phi).mul(sigma).div(root.mul(-2)),theta=(call?decay.minus(r.mul(K).mul(dk).mul(normal(d2))).plus(q.mul(S).mul(ds).mul(normal(d1))):decay.plus(r.mul(K).mul(dk).mul(normal(d2.neg()))).minus(q.mul(S).mul(ds).mul(normal(d1.neg())))).div(365),rho=K.mul(T).mul(dk).mul(call?normal(d2):normal(d2.neg()).neg()).div(100);
 return{premium:units(D.max(0,premium)),intrinsic:units(intrinsic),extrinsic:units(premium.minus(intrinsic)),delta:delta.toNumber(),gamma:gamma.toNumber(),theta:theta.toNumber(),vega:vega.toNumber(),rho:rho.toNumber(),d1:d1.toNumber(),d2:d2.toNumber(),days,volatility,rate,dividend};
}
export function impliedVolatility(spot:string,strike:string,kind:"call"|"put",days:number,premium:string,rate=0,dividend=0){
 if(days<=0)throw new Error("Volatilidade implícita exige prazo positivo.");const price=decimal(premium);let low=.0001,high=5;
 if(price.lt(decimal(blackScholes(spot,strike,kind,days,low,rate,dividend).premium))||price.gt(decimal(blackScholes(spot,strike,kind,days,high,rate,dividend).premium)))throw new Error("Prêmio fora do intervalo de preços do modelo (volatilidade 0,01% a 500%).");
 for(let i=0;i<65;i++){const mid=(low+high)/2;if(decimal(blackScholes(spot,strike,kind,days,mid,rate,dividend).premium).lt(price))low=mid;else high=mid;}return(low+high)/2;
}
