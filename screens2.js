// screens2.js — Transactions, Reports, Goals, AI
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet,
  Modal, TextInput, Alert, Dimensions, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useApp, getDark, fmt, fmtFull, todayStr, getMonthTxns, CATEGORIES, CAT_MAP, ACHIEVEMENTS_DEF, thisMonth } from './App';

const { width } = Dimensions.get('window');
const CW = width - 48;

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────
export function TransactionsScreen() {
  const { state, dispatch } = useApp();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';
  const [filter, setFilter] = useState('All');
  const FILTERS = ['All','Income','Expense','Food','Transport','Shopping','Bills','Health','Entertainment','Other'];
  const filtered = state.transactions.filter(tx => {
    if(filter==='All') return true;
    if(filter==='Income') return tx.type==='income';
    if(filter==='Expense') return tx.type==='expense';
    return tx.category===filter;
  });
  function del(id) {
    Alert.alert('Delete','Remove this transaction?',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:()=>dispatch({type:'DELETE_TRANSACTION',id})},
    ]);
  }
  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <View style={[s.hdr,{backgroundColor:T.surface,borderBottomColor:T.border}]}>
        <Text style={[s.htitle,{color:T.text}]}>💸 Transactions</Text>
        <Text style={{color:T.text2,fontSize:12,marginTop:2}}>{filtered.length} entries</Text>
      </View>
      <View style={[{backgroundColor:T.surface,borderBottomWidth:1,borderBottomColor:T.border}]}>
        <FlatList horizontal data={FILTERS} keyExtractor={i=>i} showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal:16,gap:8,paddingVertical:10}}
          renderItem={({item})=>(
            <TouchableOpacity style={[s.chip,{backgroundColor:filter===item?'rgba(110,231,183,0.15)':T.surface2,borderColor:filter===item?T.accent:T.border}]} onPress={()=>setFilter(item)}>
              <Text style={{color:filter===item?T.accent:T.text2,fontSize:12,fontWeight:'700'}}>{item}</Text>
            </TouchableOpacity>
          )}/>
      </View>
      {filtered.length===0
        ? <View style={s.empty}><Text style={{fontSize:48}}>📭</Text><Text style={{color:T.text2,fontSize:14,marginTop:12,textAlign:'center'}}>No transactions found.{'\n'}Add one from Home!</Text></View>
        : <FlatList data={filtered} keyExtractor={i=>String(i.id)} contentContainerStyle={{padding:16,paddingBottom:90}}
            renderItem={({item:tx})=>{
              const cat=CAT_MAP[tx.category]||{emoji:'💳',color:'#94a3b8'};
              return (
                <View style={[s.txRow,{backgroundColor:T.surface,borderColor:T.border}]}>
                  <View style={[s.txIcon,{backgroundColor:cat.color+'22'}]}><Text style={{fontSize:22}}>{cat.emoji}</Text></View>
                  <View style={{flex:1}}>
                    <Text style={{color:T.text,fontSize:14,fontWeight:'700'}} numberOfLines={1}>{tx.desc}</Text>
                    <Text style={{color:T.text2,fontSize:11,marginTop:2}}>{tx.category} • {tx.date}</Text>
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={{fontWeight:'800',fontSize:15,color:tx.type==='income'?'#22c55e':'#ef4444'}}>{tx.type==='income'?'+':'-'}{fmtFull(tx.amount,sym)}</Text>
                    <TouchableOpacity onPress={()=>del(tx.id)} style={{marginTop:4}}><Ionicons name="trash-outline" size={14} color={T.text3}/></TouchableOpacity>
                  </View>
                </View>
              );
            }}/>
      }
    </SafeAreaView>
  );
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
export function ReportsScreen() {
  const { state } = useApp();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';
  const [tab, setTab] = useState('Monthly');
  const TABS = ['Monthly','Weekly','Daily'];

  function getTxns() {
    if(tab==='Monthly') return state.transactions.filter(t=>t.date?.startsWith(thisMonth()));
    if(tab==='Weekly') { const w=new Date(); w.setDate(w.getDate()-7); return state.transactions.filter(t=>t.date>=w.toISOString().split('T')[0]); }
    return state.transactions.filter(t=>t.date===new Date().toISOString().split('T')[0]);
  }
  const txns=getTxns(), expenses=txns.filter(t=>t.type==='expense');
  const totalExp=expenses.reduce((s,t)=>s+t.amount,0);
  const totalInc=txns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)||state.monthlyIncome;
  const catTotals={};
  expenses.forEach(t=>{catTotals[t.category]=(catTotals[t.category]||0)+t.amount});
  const catData=Object.entries(catTotals).sort((a,b)=>b[1]-a[1]);
  const pieData=catData.slice(0,5).map(([cat,val])=>({ name:cat, amount:Math.round(val), color:(CAT_MAP[cat]||{color:'#94a3b8'}).color, legendFontColor:T.text2, legendFontSize:11 }));
  const months=[],bInc=[],bExp=[];
  for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;months.push(d.toLocaleString('default',{month:'short'}));const mt=state.transactions.filter(t=>t.date?.startsWith(k));bInc.push(mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)||0);bExp.push(mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0)||0);}
  const days14=[],dayVals=[];
  for(let i=13;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];days14.push(i%2===0?String(d.getDate()):'');dayVals.push(state.transactions.filter(t=>t.date===ds&&t.type==='expense').reduce((s,t)=>s+t.amount,0));}
  const cc={backgroundColor:T.surface,backgroundGradientFrom:T.surface,backgroundGradientTo:T.surface,decimalPlaces:0,color:(o=1)=>`rgba(110,231,183,${o})`,labelColor:()=>T.text2,propsForBackgroundLines:{stroke:T.border,strokeWidth:0.5}};

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <View style={[s.hdr,{backgroundColor:T.surface,borderBottomColor:T.border}]}><Text style={[s.htitle,{color:T.text}]}>📊 Reports</Text></View>
      <View style={{flexDirection:'row',padding:8,gap:6,backgroundColor:T.surface,borderBottomWidth:1,borderBottomColor:T.border}}>
        {TABS.map(t=><TouchableOpacity key={t} style={[{flex:1,padding:8,borderRadius:10,alignItems:'center'},tab===t&&{backgroundColor:T.accent}]} onPress={()=>setTab(t)}>
          <Text style={{color:tab===t?'#0a0f1e':T.text2,fontWeight:'700',fontSize:13}}>{t}</Text>
        </TouchableOpacity>)}
      </View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:90}} showsVerticalScrollIndicator={false}>
        <View style={{flexDirection:'row',gap:12,marginBottom:16}}>
          {[{l:'Income',v:fmt(totalInc,sym),c:'#22c55e',bg:'rgba(34,197,94,0.1)'},{l:'Expenses',v:fmt(totalExp,sym),c:'#ef4444',bg:'rgba(239,68,68,0.1)'},{l:'Saved',v:fmt(totalInc-totalExp,sym),c:'#6ee7b7',bg:'rgba(110,231,183,0.1)'}].map(i=>(
            <View key={i.l} style={[{flex:1,borderRadius:14,padding:12,alignItems:'center'},{backgroundColor:i.bg}]}>
              <Text style={{color:i.c,fontWeight:'800',fontSize:16}}>{i.v}</Text>
              <Text style={{color:T.text2,fontSize:11,marginTop:3}}>{i.l}</Text>
            </View>
          ))}
        </View>
        {pieData.length>0&&<View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>SPENDING BY CATEGORY</Text>
          <PieChart data={pieData} width={CW} height={180} chartConfig={cc} accessor="amount" backgroundColor="transparent" paddingLeft="10" hasLegend/>
        </View>}
        {catData.length>0&&<View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>TOP CATEGORIES</Text>
          {catData.slice(0,5).map(([cat,val])=>{
            const info=CAT_MAP[cat]||{color:'#94a3b8',emoji:'📦'};
            const p=totalExp?(val/totalExp*100):0;
            return <View key={cat} style={{marginBottom:12}}>
              <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                <Text style={{color:T.text,fontSize:13}}>{info.emoji} {cat}</Text>
                <Text style={{color:T.text,fontWeight:'700',fontSize:13}}>{fmtFull(val,sym)}</Text>
              </View>
              <View style={{height:7,borderRadius:99,overflow:'hidden',backgroundColor:T.surface3}}>
                <View style={{height:'100%',borderRadius:99,backgroundColor:info.color,width:`${p}%`}}/>
              </View>
            </View>;
          })}
        </View>}
        <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>6-MONTH EXPENSES</Text>
          <BarChart data={{labels:months,datasets:[{data:bExp.map(v=>v||0.1)}]}} width={CW} height={180} chartConfig={{...cc,color:(o=1)=>`rgba(239,68,68,${o})`}} style={{borderRadius:12,marginTop:4}} fromZero/>
        </View>
        <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>14-DAY TREND</Text>
          <LineChart data={{labels:days14,datasets:[{data:dayVals.map(v=>v||0)}]}} width={CW} height={180} chartConfig={cc} bezier style={{borderRadius:12,marginTop:4}} withInnerLines={false}/>
        </View>
        {pieData.length===0&&<View style={s.empty}><Text style={{fontSize:48}}>📊</Text><Text style={{color:T.text2,fontSize:14,marginTop:12,textAlign:'center'}}>No data yet.{'\n'}Add transactions to see reports!</Text></View>}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── GOALS ───────────────────────────────────────────────────────────────────
export function GoalsScreen() {
  const { state, dispatch } = useApp();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';
  const [modal,setModal]=useState(false);
  const [gName,setGName]=useState('');const [gTarget,setGTarget]=useState('');const [gSaved,setGSaved]=useState('');const [gEmoji,setGEmoji]=useState('🎯');
  const [efAmt,setEfAmt]=useState('');const [efTgt,setEfTgt]=useState(String(state.emergencyTarget||''));
  const [addAmts,setAddAmts]=useState({});

  function addGoal(){if(!gName.trim()||!gTarget){Alert.alert('Error','Fill in goal name and target');return;}const goal={id:Date.now(),name:gName.trim(),target:parseFloat(gTarget),saved:parseFloat(gSaved)||0,emoji:gEmoji||'🎯'};dispatch({type:'ADD_GOAL',goal});if(!state.achievements?.goal_setter)dispatch({type:'EARN_ACHIEVEMENT',id:'goal_setter'});setModal(false);setGName('');setGTarget('');setGSaved('');setGEmoji('🎯');}
  function addToGoal(id){const amt=parseFloat(addAmts[id]);if(!amt||amt<=0){Alert.alert('Error','Enter a valid amount');return;}const g=state.goals.find(x=>x.id===id);if(!g)return;const ns=Math.min(g.target,g.saved+amt);dispatch({type:'UPDATE_GOAL',id,updates:{saved:ns}});setAddAmts(p=>({...p,[id]:''}));if(ns/g.target>=0.5&&!state.achievements?.halfway)dispatch({type:'EARN_ACHIEVEMENT',id:'halfway'});if(ns>=g.target&&!state.achievements?.goal_complete)dispatch({type:'EARN_ACHIEVEMENT',id:'goal_complete'});}
  function addToEF(){const amt=parseFloat(efAmt);if(!amt||amt<=0){Alert.alert('Error','Enter a valid amount');return;}dispatch({type:'SET',key:'emergencyFund',value:(state.emergencyFund||0)+amt});if(!state.achievements?.emergency)dispatch({type:'EARN_ACHIEVEMENT',id:'emergency'});setEfAmt('');}

  const ef=state.emergencyFund||0,et=state.emergencyTarget||1,efP=Math.min(100,(ef/et)*100);

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <View style={[s.hdr,{backgroundColor:T.surface,borderBottomColor:T.border}]}><Text style={[s.htitle,{color:T.text}]}>🎯 Goals & Savings</Text></View>
      <ScrollView contentContainerStyle={{padding:16,paddingBottom:90}} showsVerticalScrollIndicator={false}>

        {/* Goals */}
        <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <Text style={[s.cardTitle,{color:T.text2,marginBottom:0}]}>SAVINGS GOALS</Text>
            <TouchableOpacity onPress={()=>setModal(true)}><Text style={{color:T.accent,fontWeight:'700',fontSize:13}}>+ Add</Text></TouchableOpacity>
          </View>
          {state.goals.length===0
            ?<View style={s.empty}><Text style={{fontSize:36}}>🎯</Text><Text style={{color:T.text2,fontSize:13,marginTop:8,textAlign:'center'}}>No goals yet!{'\n'}Tap + Add to create one.</Text></View>
            :state.goals.map(g=>{
              const p=g.target?Math.min(100,(g.saved/g.target)*100):0;
              return <View key={g.id} style={[{borderRadius:14,padding:14,marginBottom:12,borderWidth:1.5},{backgroundColor:T.surface2,borderColor:p>=100?T.accent:T.border}]}>
                <View style={{flexDirection:'row',alignItems:'flex-start'}}>
                  <Text style={{fontSize:22}}>{g.emoji}</Text>
                  <View style={{flex:1,marginLeft:10}}>
                    <Text style={{color:T.text,fontWeight:'700',fontSize:15}}>{g.name}</Text>
                    {p>=100&&<Text style={{color:T.accent,fontSize:11,fontWeight:'700',marginTop:1}}>✅ Goal Achieved!</Text>}
                  </View>
                  <View style={{alignItems:'flex-end'}}>
                    <Text style={{color:T.accent,fontWeight:'800',fontSize:14}}>{p.toFixed(0)}%</Text>
                    <TouchableOpacity onPress={()=>Alert.alert('Delete Goal','Remove this goal?',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>dispatch({type:'DELETE_GOAL',id:g.id})}])}>
                      <Ionicons name="trash-outline" size={14} color={T.text3} style={{marginTop:4}}/>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{height:8,borderRadius:99,overflow:'hidden',backgroundColor:T.surface3,marginVertical:8}}>
                  <LinearGradient colors={['#22c55e','#6ee7b7']} style={{height:'100%',borderRadius:99,width:`${p}%`}} start={{x:0,y:0}} end={{x:1,y:0}}/>
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:10}}>
                  <Text style={{color:T.text2,fontSize:12}}>{fmtFull(g.saved,sym)} saved</Text>
                  <Text style={{color:T.text2,fontSize:12}}>{fmtFull(g.target,sym)} goal</Text>
                </View>
                {p<100&&<View style={{flexDirection:'row',gap:8}}>
                  <TextInput style={[{flex:1,borderRadius:10,borderWidth:1.5,padding:10,fontSize:14},{backgroundColor:T.surface3,borderColor:T.border,color:T.text}]} value={addAmts[g.id]||''} onChangeText={v=>setAddAmts(p=>({...p,[g.id]:v}))} placeholder={`Add ${sym}...`} placeholderTextColor={T.text3} keyboardType="numeric"/>
                  <TouchableOpacity style={[{borderRadius:10,borderWidth:1.5,paddingHorizontal:14,paddingVertical:10,alignItems:'center',justifyContent:'center'},{backgroundColor:'rgba(110,231,183,0.15)',borderColor:T.accent}]} onPress={()=>addToGoal(g.id)}>
                    <Text style={{color:T.accent,fontWeight:'700',fontSize:13}}>+ Add</Text>
                  </TouchableOpacity>
                </View>}
              </View>;
            })
          }
        </View>

        {/* Emergency Fund */}
        <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>🛡️ EMERGENCY FUND</Text>
          <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:6}}>
            <Text style={{color:T.text,fontWeight:'700',fontSize:16}}>{fmtFull(ef,sym)}</Text>
            <Text style={{color:T.text2,fontSize:12}}>Target: {fmtFull(et,sym)}</Text>
          </View>
          <View style={{height:8,borderRadius:99,overflow:'hidden',backgroundColor:T.surface3,marginBottom:8}}>
            <LinearGradient colors={efP>=100?['#6ee7b7','#22c55e']:efP>=50?['#eab308','#f59e0b']:['#ef4444','#ff6b6b']} style={{height:'100%',borderRadius:99,width:`${efP}%`}} start={{x:0,y:0}} end={{x:1,y:0}}/>
          </View>
          <Text style={{color:T.text2,fontSize:12,marginBottom:12}}>{efP.toFixed(0)}% • {efP>=100?'Fully funded! 🎉':`${fmtFull(et-ef,sym)} to go`}</Text>
          <View style={{flexDirection:'row',gap:8,marginBottom:8}}>
            <TextInput style={[{flex:1,borderRadius:10,borderWidth:1.5,padding:10,fontSize:14},{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={efAmt} onChangeText={setEfAmt} placeholder={`Add to fund (${sym})`} placeholderTextColor={T.text3} keyboardType="numeric"/>
            <TouchableOpacity style={[{borderRadius:10,borderWidth:1.5,paddingHorizontal:14,paddingVertical:10},{backgroundColor:'rgba(110,231,183,0.15)',borderColor:T.accent}]} onPress={addToEF}>
              <Text style={{color:T.accent,fontWeight:'700'}}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection:'row',gap:8}}>
            <TextInput style={[{flex:1,borderRadius:10,borderWidth:1.5,padding:10,fontSize:14},{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={efTgt} onChangeText={setEfTgt} placeholder="Set target amount" placeholderTextColor={T.text3} keyboardType="numeric"/>
            <TouchableOpacity style={[{borderRadius:10,borderWidth:1.5,paddingHorizontal:14,paddingVertical:10},{backgroundColor:T.surface2,borderColor:T.border}]} onPress={()=>{const t=parseFloat(efTgt);if(t>0)dispatch({type:'SET',key:'emergencyTarget',value:t});}}>
              <Text style={{color:T.text2,fontWeight:'700'}}>Set</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Achievements */}
        <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
          <Text style={[s.cardTitle,{color:T.text2}]}>🏆 ACHIEVEMENTS</Text>
          <View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
            {ACHIEVEMENTS_DEF.map(a=>{
              const earned=!!state.achievements?.[a.id];
              return <View key={a.id} style={[{width:'47%',borderRadius:14,padding:14,borderWidth:1.5,alignItems:'center'},{backgroundColor:T.surface2,borderColor:earned?'#f59e0b':T.border},earned&&{backgroundColor:'rgba(245,158,11,0.07)'}]}>
                <Text style={{fontSize:28,opacity:earned?1:0.25}}>{a.icon}</Text>
                <Text style={{color:earned?T.text:T.text3,fontWeight:'700',fontSize:12,marginTop:6,textAlign:'center'}}>{a.name}</Text>
                <Text style={{color:T.text3,fontSize:10,marginTop:2,textAlign:'center',lineHeight:14}}>{a.desc}</Text>
                {earned&&<Text style={{color:'#f59e0b',fontSize:10,fontWeight:'700',marginTop:4}}>Earned ✓</Text>}
              </View>;
            })}
          </View>
        </View>
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={modal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.sheet,{backgroundColor:T.surface}]}>
            <View style={s.handle}/>
            <Text style={[s.modalTitle,{color:T.text}]}>Add Savings Goal</Text>
            {[{l:'GOAL NAME',v:gName,set:setGName,p:'e.g. iPhone, Vacation...',k:'default'},{l:`TARGET AMOUNT (${sym})`,v:gTarget,set:setGTarget,p:'0',k:'numeric'},{l:`SAVED SO FAR (${sym})`,v:gSaved,set:setGSaved,p:'0',k:'numeric'},{l:'EMOJI ICON',v:gEmoji,set:setGEmoji,p:'🎯',k:'default'}].map(f=>(
              <View key={f.l}>
                <Text style={{color:T.text2,fontSize:11,fontWeight:'700',marginBottom:6,letterSpacing:0.6}}>{f.l}</Text>
                <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={f.v} onChangeText={f.set} placeholder={f.p} placeholderTextColor={T.text3} keyboardType={f.k}/>
              </View>
            ))}
            <View style={{flexDirection:'row',gap:10,marginTop:8}}>
              <TouchableOpacity style={[s.btnGhost,{flex:1,borderColor:T.border,backgroundColor:T.surface2}]} onPress={()=>setModal(false)}><Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={{flex:2}} onPress={addGoal}><LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.btnGrad} start={{x:0,y:0}} end={{x:1,y:1}}><Text style={{color:'#0a0f1e',fontWeight:'800',fontSize:15,textAlign:'center'}}>Add Goal</Text></LinearGradient></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── AI SCREEN ────────────────────────────────────────────────────────────────
const QQ = ['How can I save more this month?','Why am I overspending?','How much can I spend daily?','Reach savings goal faster?','My biggest spending areas?','Weekly financial insight','Any unusual patterns?','Give me a financial tip'];

export function AIScreen() {
  const { state, dispatch } = useApp();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';
  const [input,setInput]=useState('');
  const [loading,setLoading]=useState(false);
  const scrollRef=useRef(null);

  useEffect(()=>{
    if(state.chatHistory.length===0){
      const w={role:'assistant',content:`Hi ${state.name||'there'}! 👋 I'm Zara, your AI budget advisor.\n\nI analyze your real spending and give personalized tips. What would you like to know?`,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})};
      dispatch({type:'ADD_CHAT',msg:w});
    }
  },[]);

  useEffect(()=>{setTimeout(()=>scrollRef.current?.scrollToEnd({animated:true}),100);},[state.chatHistory]);

  async function send(text){
    const q=text||input.trim(); if(!q) return; setInput('');
    dispatch({type:'ADD_CHAT',msg:{role:'user',content:q,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}});
    setLoading(true);
    try {
      const monthly=getMonthTxns(state.transactions);
      const exp=monthly.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
      const inc=monthly.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)||state.monthlyIncome;
      const catSpend={};monthly.filter(t=>t.type==='expense').forEach(t=>{catSpend[t.category]=(catSpend[t.category]||0)+t.amount;});
      const now=new Date();
      const daysLeft=new Date(now.getFullYear(),now.getMonth()+1,0).getDate()-now.getDate();
      const sys=`You are Zara, a friendly AI budget advisor in BudgetAI app.\nUser: ${state.name} | Currency: ${state.country?.currency||'USD'} (${sym}) | Country: ${state.country?.name||'Unknown'}\nBudget: ${sym}${state.monthlyBudget} | Income: ${sym}${inc.toFixed(0)} | Spent: ${sym}${exp.toFixed(0)} | ${daysLeft} days left | Remaining: ${sym}${(state.monthlyBudget-exp).toFixed(0)}\nCategory spending: ${JSON.stringify(Object.fromEntries(Object.entries(catSpend).map(([k,v])=>[k,sym+v.toFixed(0)])))}\nGoals: ${state.goals.length} | Emergency Fund: ${sym}${state.emergencyFund||0}\nBe warm, specific, under 120 words. Use real data. Give actionable advice. Never claim to control money.`;
      const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,system:sys,messages:[...state.chatHistory.slice(-8).map(m=>({role:m.role,content:m.content})),{role:'user',content:q}]})});
      if(!res.ok) throw new Error('API error');
      const data=await res.json();
      dispatch({type:'ADD_CHAT',msg:{role:'assistant',content:data.content?.[0]?.text||'Sorry, try again!',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}});
    } catch(e) {
      const monthly=getMonthTxns(state.transactions);
      const exp=monthly.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
      const remaining=state.monthlyBudget-exp;
      const catSpend={};monthly.filter(t=>t.type==='expense').forEach(t=>{catSpend[t.category]=(catSpend[t.category]||0)+t.amount;});
      const top=Object.entries(catSpend).sort((a,b)=>b[1]-a[1])[0];
      const daysLeft=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate()-new Date().getDate();
      const daily=daysLeft>0?remaining/daysLeft:0;
      const pct=state.monthlyBudget?((exp/state.monthlyBudget)*100).toFixed(0):0;
      const lq=q.toLowerCase();
      let reply;
      if(lq.includes('save'))reply=`💡 You've spent ${sym}${exp.toFixed(0)} (${pct}% of budget). To save more: cut ${top?top[0]:'top'} expenses, automate savings first. Remaining: ${sym}${remaining.toFixed(0)} for ${daysLeft} days.`;
      else if(lq.includes('daily'))reply=`📅 With ${sym}${remaining.toFixed(0)} left for ${daysLeft} days, your daily limit is ${sym}${daily.toFixed(0)}/day.`;
      else if(lq.includes('goal'))reply=`🎯 To reach goals faster: add any bonuses to goals directly, cut ${top?top[0]:'top'} spending by 10%, automate transfers on payday.`;
      else reply=`📊 Snapshot: ${pct}% budget used, ${sym}${remaining.toFixed(0)} remaining, ${sym}${daily.toFixed(0)}/day limit. ${top?'Top spend: '+top[0]+'.':''} Ask me anything!`;
      dispatch({type:'ADD_CHAT',msg:{role:'assistant',content:reply,time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}});
    } finally { setLoading(false); }
  }

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <View style={[s.hdr,{backgroundColor:T.surface,borderBottomColor:T.border,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}]}>
        <View style={{flexDirection:'row',alignItems:'center',gap:10}}>
          <LinearGradient colors={['#6ee7b7','#3b82f6']} style={{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center'}} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={{fontSize:22}}>🤖</Text>
          </LinearGradient>
          <View>
            <Text style={{color:T.text,fontSize:15,fontWeight:'800'}}>Zara — AI Advisor</Text>
            <Text style={{color:'#6ee7b7',fontSize:11,fontWeight:'600'}}>● Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={()=>dispatch({type:'CLEAR_CHAT'})}><Ionicons name="refresh-outline" size={20} color={T.text2}/></TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':'height'} keyboardVerticalOffset={90}>
        <View style={{backgroundColor:T.surface,borderBottomWidth:1,borderBottomColor:T.border}}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:16,gap:8,paddingVertical:8}}>
            {QQ.map(q=><TouchableOpacity key={q} style={{borderRadius:99,borderWidth:1.5,paddingHorizontal:12,paddingVertical:6,backgroundColor:T.surface2,borderColor:T.border}} onPress={()=>send(q)}>
              <Text style={{color:T.text2,fontSize:12,fontWeight:'500'}}>{q}</Text>
            </TouchableOpacity>)}
          </ScrollView>
        </View>
        <ScrollView ref={scrollRef} style={{flex:1}} contentContainerStyle={{padding:16,paddingBottom:8}} showsVerticalScrollIndicator={false} onContentSizeChange={()=>scrollRef.current?.scrollToEnd({animated:true})}>
          {state.chatHistory.map((msg,i)=>(
            <View key={i} style={{flexDirection:'row',marginBottom:12,alignItems:'flex-end',justifyContent:msg.role==='user'?'flex-end':'flex-start'}}>
              {msg.role==='assistant'&&<View style={{width:32,height:32,borderRadius:16,backgroundColor:'rgba(110,231,183,0.15)',alignItems:'center',justifyContent:'center',marginRight:8}}><Text style={{fontSize:14}}>🤖</Text></View>}
              <View style={{maxWidth:'80%'}}>
                <View style={[{borderRadius:18,padding:12,borderWidth:1},msg.role==='user'?{backgroundColor:'#6ee7b7',borderColor:'#6ee7b7',borderBottomRightRadius:4}:{backgroundColor:T.surface2,borderColor:T.border,borderBottomLeftRadius:4}]}>
                  <Text style={{color:msg.role==='user'?'#0a0f1e':T.text,fontSize:14,lineHeight:21}}>{msg.content}</Text>
                </View>
                <Text style={{fontSize:10,color:T.text3,marginTop:3,paddingHorizontal:4,textAlign:msg.role==='user'?'right':'left'}}>{msg.time}</Text>
              </View>
            </View>
          ))}
          {loading&&<View style={{flexDirection:'row',marginBottom:12,alignItems:'flex-end'}}>
            <View style={{width:32,height:32,borderRadius:16,backgroundColor:'rgba(110,231,183,0.15)',alignItems:'center',justifyContent:'center',marginRight:8}}><Text style={{fontSize:14}}>🤖</Text></View>
            <View style={{borderRadius:18,padding:12,borderWidth:1,backgroundColor:T.surface2,borderColor:T.border}}><ActivityIndicator size="small" color={T.accent}/></View>
          </View>}
        </ScrollView>
        <View style={{flexDirection:'row',alignItems:'flex-end',padding:12,gap:8,backgroundColor:T.surface,borderTopWidth:1,borderTopColor:T.border}}>
          <TextInput style={{flex:1,borderRadius:22,borderWidth:1.5,paddingHorizontal:16,paddingVertical:10,fontSize:14,maxHeight:100,backgroundColor:T.surface2,borderColor:T.border,color:T.text}} value={input} onChangeText={setInput} placeholder="Ask anything about your budget..." placeholderTextColor={T.text3} multiline maxLength={500}/>
          <TouchableOpacity onPress={()=>send()} disabled={loading||!input.trim()}>
            <LinearGradient colors={['#3b82f6','#a78bfa']} style={{width:44,height:44,borderRadius:22,alignItems:'center',justifyContent:'center',opacity:input.trim()?1:0.4}} start={{x:0,y:0}} end={{x:1,y:1}}>
              <Ionicons name="send" size={18} color="#fff"/>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  hdr:{paddingHorizontal:16,paddingVertical:14,borderBottomWidth:1},
  htitle:{fontSize:22,fontWeight:'800'},
  chip:{borderRadius:99,paddingVertical:6,paddingHorizontal:14,borderWidth:1.5},
  txRow:{flexDirection:'row',alignItems:'center',gap:12,padding:14,borderRadius:14,marginBottom:8,borderWidth:1},
  txIcon:{width:46,height:46,borderRadius:14,alignItems:'center',justifyContent:'center'},
  card:{borderRadius:16,padding:16,marginBottom:16,borderWidth:1},
  cardTitle:{fontSize:11,fontWeight:'700',letterSpacing:0.8,textTransform:'uppercase',marginBottom:12},
  empty:{alignItems:'center',justifyContent:'center',paddingVertical:40},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'flex-end'},
  sheet:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:24},
  handle:{width:40,height:4,backgroundColor:'rgba(255,255,255,0.15)',borderRadius:2,alignSelf:'center',marginBottom:20},
  modalTitle:{fontSize:22,fontWeight:'800',marginBottom:16},
  inp:{borderWidth:1.5,borderRadius:12,padding:13,fontSize:15,marginBottom:12},
  btnGhost:{borderWidth:1.5,borderRadius:12,padding:14},
  btnGrad:{borderRadius:12,padding:14},
});

export default { TransactionsScreen, ReportsScreen, GoalsScreen, AIScreen };
