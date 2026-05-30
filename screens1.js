// screens1.js — HomeScreen
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp, getDark, fmt, fmtFull, todayStr, getMonthTxns, getTodayTxns, CATEGORIES, CAT_MAP, getHourGreeting } from './App';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const EXPENSE_CATS = CATEGORIES.filter(c => !['Salary','Investment'].includes(c.id));
const INCOME_CATS  = CATEGORIES.filter(c => ['Salary','Investment','Other'].includes(c.id));

export default function HomeScreen() {
  const { state, dispatch } = useApp();
  const navigation = useNavigation();
  const T = getDark(state.darkMode);
  const sym = state.country?.symbol || '$';

  const [addModal, setAddModal] = useState(false);
  const [txType,   setTxType]   = useState('expense');
  const [amount,   setAmount]   = useState('');
  const [desc,     setDesc]     = useState('');
  const [date,     setDate]     = useState(todayStr());
  const [selCat,   setSelCat]   = useState('Food');

  const monthly      = getMonthTxns(state.transactions);
  const totalExpense = monthly.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const totalIncome  = monthly.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0) || state.monthlyIncome;
  const budget    = state.monthlyBudget || totalIncome;
  const remaining = budget - totalExpense;
  const pct       = budget ? Math.min(100,(totalExpense/budget)*100) : 0;

  const today    = getTodayTxns(state.transactions);
  const todayInc = today.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const todayExp = today.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const recent   = state.transactions.slice(0,5);

  function addTransaction() {
    if (!amount || parseFloat(amount)<=0) { Alert.alert('Error','Enter a valid amount'); return; }
    if (!desc.trim()) { Alert.alert('Error','Enter a description'); return; }
    const tx = { id:Date.now(), type:txType, amount:parseFloat(amount), desc:desc.trim(), date, category: txType==='income'?selCat:selCat };
    dispatch({ type:'ADD_TRANSACTION', tx });
    if (!state.achievements?.first_tx) dispatch({ type:'EARN_ACHIEVEMENT', id:'first_tx' });
    if (state.transactions.length>=9 && !state.achievements?.ten_txns) dispatch({ type:'EARN_ACHIEVEMENT', id:'ten_txns' });
    setAddModal(false); setAmount(''); setDesc(''); setDate(todayStr()); setSelCat('Food');
  }

  const progColor = pct>=90?['#ef4444','#ff6b6b']:pct>=70?['#eab308','#f59e0b']:['#22c55e','#6ee7b7'];
  const cats = txType==='expense' ? EXPENSE_CATS : INCOME_CATS;

  return (
    <SafeAreaView style={{flex:1,backgroundColor:T.bg}} edges={['top']}>
      <ScrollView contentContainerStyle={{paddingBottom:90}} showsVerticalScrollIndicator={false}>

        {/* Topbar */}
        <View style={[s.topbar,{backgroundColor:T.surface,borderBottomColor:T.border}]}>
          <View>
            <Text style={[s.logo,{color:T.accent}]}>BudgetAI</Text>
            <Text style={{color:T.text2,fontSize:12}}>{getHourGreeting()}, {state.name} 👋</Text>
          </View>
          <TouchableOpacity style={[s.iconBtn,{backgroundColor:T.surface2,borderColor:T.border}]} onPress={()=>navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={20} color={T.text}/>
          </TouchableOpacity>
        </View>

        <View style={{padding:16}}>
          {/* Alert */}
          {pct>=90 && <View style={[s.alert,{backgroundColor:'rgba(239,68,68,0.12)',borderColor:'rgba(239,68,68,0.3)'}]}>
            <Text style={{color:'#fca5a5',fontSize:13,lineHeight:20}}>🚨 {pct>=100?"You've exceeded your budget!":`Warning: ${pct.toFixed(0)}% of budget used!`} Remaining: {fmtFull(remaining,sym)}</Text>
          </View>}

          {/* Hero */}
          <LinearGradient colors={['#1a2a4a','#0f1f3a']} style={s.hero} start={{x:0,y:0}} end={{x:1,y:1}}>
            <Text style={s.heroLabel}>REMAINING BUDGET</Text>
            <Text style={[s.heroAmt,{color:remaining<0?'#ef4444':'#fff'}]}>{fmtFull(remaining,sym)}</Text>
            <Text style={s.heroSub}>of {fmtFull(budget,sym)} monthly budget</Text>
            <View style={s.progBg}>
              <LinearGradient colors={progColor} style={[s.progFill,{width:`${pct}%`}]} start={{x:0,y:0}} end={{x:1,y:0}}/>
            </View>
            <View style={{flexDirection:'row',gap:12,marginTop:16}}>
              {[{l:'Income',v:fmt(totalIncome,sym),c:'#22c55e'},{l:'Spent',v:fmt(totalExpense,sym),c:'#ef4444'}].map(i=>(
                <View key={i.l} style={s.heroStat}>
                  <Text style={{color:i.c,fontSize:20,fontWeight:'800'}}>{i.v}</Text>
                  <Text style={{color:'rgba(255,255,255,0.4)',fontSize:11,marginTop:2}}>{i.l}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Today */}
          <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
            <Text style={[s.cardTitle,{color:T.text2}]}>TODAY</Text>
            <View style={{flexDirection:'row',gap:8}}>
              {[{l:'Income',v:fmt(todayInc,sym),c:T.green},{l:'Spent',v:fmt(todayExp,sym),c:T.red},{l:'Net',v:fmt(todayInc-todayExp,sym),c:T.accent}].map(i=>(
                <View key={i.l} style={[s.todayStat,{backgroundColor:T.surface2}]}>
                  <Text style={{fontSize:11,color:T.text2,marginBottom:4,fontWeight:'600'}}>{i.l}</Text>
                  <Text style={{fontSize:17,fontWeight:'800',color:i.c}}>{i.v}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Recent */}
          <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
            <View style={s.cardHead}>
              <Text style={[s.cardTitle,{color:T.text2}]}>RECENT TRANSACTIONS</Text>
              <TouchableOpacity onPress={()=>navigation.navigate('Transactions')}><Text style={{color:T.accent,fontSize:12,fontWeight:'700'}}>See All</Text></TouchableOpacity>
            </View>
            {recent.length===0
              ? <View style={s.empty}><Text style={{fontSize:36}}>📭</Text><Text style={{color:T.text3,fontSize:13,marginTop:8,textAlign:'center'}}>No transactions yet.{'\n'}Tap + to add one!</Text></View>
              : recent.map(tx => <TxItem key={tx.id} tx={tx} T={T} sym={sym}/>)
            }
          </View>

          {/* Goals preview */}
          {state.goals.length>0 && (
            <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
              <View style={s.cardHead}>
                <Text style={[s.cardTitle,{color:T.text2}]}>SAVINGS GOALS</Text>
                <TouchableOpacity onPress={()=>navigation.navigate('Goals')}><Text style={{color:T.accent,fontSize:12,fontWeight:'700'}}>Manage</Text></TouchableOpacity>
              </View>
              {state.goals.slice(0,2).map(g=>{
                const p=g.target?Math.min(100,(g.saved/g.target)*100):0;
                return <View key={g.id} style={{marginBottom:12}}>
                  <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                    <Text style={{color:T.text,fontSize:13,fontWeight:'700'}}>{g.emoji} {g.name}</Text>
                    <Text style={{color:T.text2,fontSize:12}}>{p.toFixed(0)}%</Text>
                  </View>
                  <View style={[s.progBg2,{backgroundColor:T.surface3}]}>
                    <LinearGradient colors={['#22c55e','#6ee7b7']} style={[s.progFill2,{width:`${p}%`}]} start={{x:0,y:0}} end={{x:1,y:0}}/>
                  </View>
                </View>;
              })}
            </View>
          )}

          {/* Upcoming bills */}
          {state.recurring.length>0 && (
            <View style={[s.card,{backgroundColor:T.surface,borderColor:T.border}]}>
              <Text style={[s.cardTitle,{color:T.text2}]}>UPCOMING BILLS</Text>
              {state.recurring.slice(0,3).map(r=>{
                const days=(r.day-new Date().getDate()+31)%31;
                return <View key={r.id} style={[s.billRow,{borderBottomColor:T.border}]}>
                  <View>
                    <Text style={{color:T.text,fontSize:13,fontWeight:'600'}}>💡 {r.name}</Text>
                    <Text style={{color:days===0?T.red:T.text2,fontSize:11,marginTop:2}}>{days===0?'⚠️ Due Today!':`Due in ${days} day${days!==1?'s':''}`}</Text>
                  </View>
                  <Text style={{color:T.text,fontWeight:'800',fontSize:14}}>{fmtFull(r.amount,sym)}</Text>
                </View>;
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={()=>setAddModal(true)}>
        <LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.fabGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
          <Ionicons name="add" size={28} color="#0a0f1e"/>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal visible={addModal} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={[s.sheet,{backgroundColor:T.surface}]}>
            <View style={s.handle}/>
            <Text style={[s.modalTitle,{color:T.text}]}>Add Transaction</Text>
            <View style={[s.toggle,{backgroundColor:T.surface2}]}>
              {['expense','income'].map(t=>(
                <TouchableOpacity key={t} style={[s.toggleOpt,txType===t&&s.toggleActive]} onPress={()=>setTxType(t)}>
                  <Text style={{color:txType===t?'#0a0f1e':T.text2,fontWeight:'700',fontSize:14}}>{t==='expense'?'💸 Expense':'💵 Income'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {[{l:`AMOUNT (${sym})`,v:amount,s:setAmount,k:'numeric',p:'0.00'},{l:'DESCRIPTION',v:desc,s:setDesc,k:'default',p:'What was this for?'},{l:'DATE',v:date,s:setDate,k:'default',p:'YYYY-MM-DD'}].map(f=>(
              <View key={f.l}>
                <Text style={{color:T.text2,fontSize:11,fontWeight:'700',marginBottom:6,letterSpacing:0.6}}>{f.l}</Text>
                <TextInput style={[s.inp,{backgroundColor:T.surface2,borderColor:T.border,color:T.text}]} value={f.v} onChangeText={f.s} placeholder={f.p} placeholderTextColor={T.text3} keyboardType={f.k}/>
              </View>
            ))}
            <Text style={{color:T.text2,fontSize:11,fontWeight:'700',marginBottom:8,letterSpacing:0.6}}>CATEGORY</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:16}}>
              {cats.map(c=>(
                <TouchableOpacity key={c.id} onPress={()=>setSelCat(c.id)}
                  style={[s.catChip,{backgroundColor:selCat===c.id?c.color+'22':T.surface2,borderColor:selCat===c.id?c.color:T.border}]}>
                  <Text style={{fontSize:18}}>{c.emoji}</Text>
                  <Text style={{fontSize:11,color:selCat===c.id?c.color:T.text2,fontWeight:'600',marginTop:2}}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={{flexDirection:'row',gap:10}}>
              <TouchableOpacity style={[s.btnGhost,{flex:1,borderColor:T.border,backgroundColor:T.surface2}]} onPress={()=>setAddModal(false)}>
                <Text style={{color:T.text2,fontWeight:'700',textAlign:'center'}}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{flex:2}} onPress={addTransaction}>
                <LinearGradient colors={['#6ee7b7','#3b82f6']} style={s.btnGrad} start={{x:0,y:0}} end={{x:1,y:1}}>
                  <Text style={{color:'#0a0f1e',fontWeight:'800',fontSize:15,textAlign:'center'}}>Add Transaction</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function TxItem({tx,T,sym}) {
  const cat = CAT_MAP[tx.category]||{emoji:'💳',color:'#94a3b8'};
  return (
    <View style={[s.txRow,{borderBottomColor:T.border}]}>
      <View style={[s.txIcon,{backgroundColor:cat.color+'22'}]}><Text style={{fontSize:20}}>{cat.emoji}</Text></View>
      <View style={{flex:1}}>
        <Text style={{color:T.text,fontSize:14,fontWeight:'600'}} numberOfLines={1}>{tx.desc}</Text>
        <Text style={{color:T.text2,fontSize:11,marginTop:2}}>{tx.category} • {tx.date}</Text>
      </View>
      <Text style={{fontWeight:'800',fontSize:15,color:tx.type==='income'?'#22c55e':'#ef4444'}}>
        {tx.type==='income'?'+':'-'}{fmtFull(tx.amount,sym)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  topbar:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1},
  logo:{fontSize:22,fontWeight:'800',letterSpacing:-0.5},
  iconBtn:{width:38,height:38,borderRadius:19,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
  alert:{borderRadius:12,padding:12,borderWidth:1,marginBottom:12},
  hero:{borderRadius:20,padding:20,marginBottom:16},
  heroLabel:{color:'rgba(255,255,255,0.5)',fontSize:11,fontWeight:'700',letterSpacing:0.8,textTransform:'uppercase',marginBottom:4},
  heroAmt:{fontSize:38,fontWeight:'800',letterSpacing:-1},
  heroSub:{color:'rgba(255,255,255,0.4)',fontSize:12,marginTop:2,marginBottom:12},
  heroStat:{flex:1,backgroundColor:'rgba(255,255,255,0.06)',borderRadius:12,padding:12},
  progBg:{height:8,backgroundColor:'rgba(255,255,255,0.1)',borderRadius:99,overflow:'hidden'},
  progFill:{height:'100%',borderRadius:99},
  progBg2:{height:7,borderRadius:99,overflow:'hidden'},
  progFill2:{height:'100%',borderRadius:99},
  card:{borderRadius:16,padding:16,marginBottom:16,borderWidth:1},
  cardTitle:{fontSize:11,fontWeight:'700',letterSpacing:0.8,textTransform:'uppercase',marginBottom:12},
  cardHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  todayStat:{flex:1,borderRadius:12,padding:12,alignItems:'center'},
  txRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,borderBottomWidth:1},
  txIcon:{width:44,height:44,borderRadius:12,alignItems:'center',justifyContent:'center'},
  billRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1},
  empty:{alignItems:'center',paddingVertical:24},
  fab:{position:'absolute',right:20,bottom:80},
  fabGrad:{width:58,height:58,borderRadius:29,alignItems:'center',justifyContent:'center',elevation:8},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.6)',justifyContent:'flex-end'},
  sheet:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,maxHeight:'92%'},
  handle:{width:40,height:4,backgroundColor:'rgba(255,255,255,0.15)',borderRadius:2,alignSelf:'center',marginBottom:20},
  modalTitle:{fontSize:22,fontWeight:'800',marginBottom:16},
  toggle:{flexDirection:'row',borderRadius:12,padding:4,marginBottom:16},
  toggleOpt:{flex:1,padding:10,borderRadius:10,alignItems:'center'},
  toggleActive:{backgroundColor:'#6ee7b7'},
  inp:{borderWidth:1.5,borderRadius:12,padding:13,fontSize:15,marginBottom:12},
  catChip:{borderWidth:1.5,borderRadius:12,padding:10,alignItems:'center',marginRight:8,minWidth:64},
  btnGhost:{borderWidth:1.5,borderRadius:12,padding:14},
  btnGrad:{borderRadius:12,padding:14},
});
