import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../scripts/one-pilot-metrics.mjs';

const at='2026-10-27T12:00:00Z';
const request = extra => ({id:'TEST_R1',user_id:'TEST_U1',created_at:'2026-10-26T08:00:00Z',response_due_at:'2026-10-26T12:00:00Z',
 is_test:false,...extra}); // Synthetic records solely for exercising the analyzer.
const activity = extra => ({user_id:'TEST_U1',at:'2026-10-26T08:00:00Z',type:'map_profile_open_after_search',audience:'customer',is_test:false,...extra});
test('No data never implies a successful pilot or a zero failure rate',()=>{
 const r=summarize({requests:[],activities:[]},at);
 assert.equal(r.status,'no_real_request_data');assert.equal(r.confirmed_matches_percent,null);assert.equal(r.no_response_after_deadline_percent,null);assert.equal(r.active_people_7d,0);
});
test('Test requests and demo/page-view activities do not inflate success or active users',()=>{
 const r=summarize({requests:[request({is_test:true})],activities:[activity({is_test:true}),activity({type:'page_view'}),activity({type:'demo_preview'})]},at);
 assert.equal(r.real_requests,0);assert.equal(r.active_people_7d,0);
});
test('All real requests remain in the total; deadlines, early cancellation and pending work are explicit',()=>{
 const r=summarize({requests:[request({}),request({id:'TEST_R2',cancelled_at:'2026-10-26T09:00:00Z'}),request({id:'TEST_R3',response_due_at:'2026-10-28T12:00:00Z'})],activities:[]},at);
 assert.equal(r.real_requests,3);assert.equal(r.mature_requests,1);assert.equal(r.cancelled_before_deadline,1);assert.equal(r.pending_before_deadline,1);
 assert.equal(r.no_response_after_deadline_percent,100);assert.equal(r.helpful_within_deadline_percent,0);
});
test('Helpful replies, confirmed appointments and completed services are distinct',()=>{
 const r=summarize({requests:[request({first_response_at:'2026-10-26T09:00:00Z',first_helpful_response_at:'2026-10-26T09:00:00Z',confirmed_at:'2026-10-26T10:00:00Z',customer_completed_at:'2026-10-27T08:00:00Z',manual_minutes:8,manual_reminders:1})],activities:[]},at);
 assert.equal(r.helpful_within_deadline_percent,100);assert.equal(r.current_confirmed_matches,1);assert.equal(r.completed_confirmed_by_both,0);
 assert.equal(r.median_first_response_minutes,60);assert.equal(r.median_manual_minutes,8);
});
test('Cancellation after confirmation is never counted as current confirmed success',()=>{
 const r=summarize({requests:[request({first_response_at:'2026-10-26T09:00:00Z',first_helpful_response_at:'2026-10-26T09:00:00Z',confirmed_at:'2026-10-26T10:00:00Z',cancelled_at:'2026-10-26T11:00:00Z'})],activities:[]},at);
 assert.equal(r.current_confirmed_matches,0);assert.equal(r.confirmed_then_cancelled,1);assert.equal(r.confirmed_matches_percent,0);
});
test('Activity counts people once and requires different Berlin calendar days for returning use',()=>{
 const r=summarize({requests:[request({})],activities:[activity({}),activity({at:'2026-10-27T09:00:00Z'}),activity({user_id:'TEST_B1',audience:'business',type:'live_response'})]},at);
 assert.equal(r.active_people_7d,2);assert.equal(r.active_customers_7d,1);assert.equal(r.active_business_people_7d,1);assert.equal(r.returning_people_14d,1);
});
test('Duplicate IDs, missing test labels, contact fields and impossible timelines fail loudly',()=>{
 for (const records of [[request({}),request({})],[request({email:'private@example.invalid'})],[request({is_test:null})],[request({confirmed_at:'2026-10-26T10:00:00Z'})],[request({created_at:'2026-10-26T08:00:00'})]]) {
  assert.throws(()=>summarize({requests:records,activities:[]},at));
 }
});
test('Historical cutoffs ignore later events instead of claiming early success',()=>{
 const r=summarize({requests:[request({first_response_at:'2026-10-28T09:00:00Z',first_helpful_response_at:'2026-10-28T09:00:00Z',confirmed_at:'2026-10-28T10:00:00Z'})],activities:[]},at);
 assert.equal(r.current_confirmed_matches,0);assert.equal(r.no_response_after_deadline,1);
});
