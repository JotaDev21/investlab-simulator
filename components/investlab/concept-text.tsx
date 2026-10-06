"use client";
import { Popover,PopoverTrigger,PopoverContent } from "@/components/ui/popover";
import { Children,cloneElement,isValidElement,type ReactNode,type ReactElement } from "react";
import { GLOSSARY } from "@/lib/lab/Glossary";
const aliases:Record<string,string>={"inflação":"inflation","juros compostos":"compound","porcentagem":"percentage","renda fixa":"cdb","Selic":"selic","CDI":"cdi","IPCA":"ipca","CDB":"cdb","Tesouro":"treasury","LCI":"lci","LCA":"lci","FGC":"fgc","liquidez":"liquidity","dividendos":"dividend","JCP":"dividend","ETF":"index","ETFs":"index","FII":"fiis","FIIs":"fiis","vacância":"vacancy","cotização":"fund-redemption","come-cotas":"come","PGBL":"pension","VGBL":"pension","volatilidade":"volatility","drawdown":"drawdown","Sharpe":"sharpe","beta":"beta","alfa":"alpha","correlação":"correlation","duration":"duration","convexidade":"convexity","curva de juros":"yield-curve","marcação a mercado":"mtm","hedge":"hedge","futuros":"future","short":"short","strike":"option-parts","prêmio":"option-parts","delta":"greeks","gamma":"greeks","theta":"greeks","vega":"greeks","replay":"replay","custódia":"custody","blockchain":"blockchain","ROE":"roe","ROIC":"roic","EBITDA":"ebitda","P/L":"pe","P/VP":"pb","payout":"payout","risco":"risk","retorno real":"ipca"};
for(const [id,d] of Object.entries(GLOSSARY))aliases[d.title]??=id;
aliases.IR="tax";aliases.IOF="tax";aliases.call="option";aliases.put="option";aliases.margem="leverage-risk";aliases["taxa de administração"]="management-fee";aliases.performance="performance-fee";aliases.rho="greeks";aliases.benchmark="index";aliases.alavancagem="leverage-risk";aliases["curva"]="yield-curve";
const terms=Object.keys(aliases).sort((a,b)=>b.length-a.length),escaped=terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")),pattern=new RegExp(`(${escaped.join("|")})`,"gi");
export function ConceptText({text}:{text:string}){return <>{text.split(pattern).map((part,i)=>{const alias=terms.find(t=>t.toLocaleLowerCase("pt-BR")===part.toLocaleLowerCase("pt-BR")),definition=alias?GLOSSARY[aliases[alias]]:null;if(!definition)return part;return <Popover key={i}><PopoverTrigger asChild><button type="button" className="concept-inline" aria-label={`Entender ${part}`}>{part}</button></PopoverTrigger><PopoverContent className="concept-popover"><strong>{definition.title}</strong><p>{definition.meaning}</p><p>{definition.formula}</p><p>{definition.example}</p><small>{definition.limits}</small></PopoverContent></Popover>;})}</>;}
// Render contextual help in ordinary prose without changing form labels or nesting buttons.
export function explainConcepts(node:ReactNode,eligible=false,disabled=false):ReactNode{
 if(typeof node==="string"){pattern.lastIndex=0;return eligible&&!disabled&&pattern.test(node)?<ConceptText text={node}/>:node;}
 if(Array.isArray(node))return Children.map(node,child=>explainConcepts(child,eligible,disabled));
 if(!isValidElement(node))return node;
 const element=node as ReactElement<{children?:ReactNode}>,tag=typeof element.type==="string"?element.type:"",blocked=disabled||["button","a","label","select","option","input","textarea","summary"].includes(tag),scope=["p","span","small","dt","th"].includes(tag)||eligible;
 if(!element.props.children)return node;return cloneElement(element,undefined,explainConcepts(element.props.children,scope,blocked));
}
