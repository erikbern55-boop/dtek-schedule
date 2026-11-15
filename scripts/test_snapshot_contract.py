#!/usr/bin/env python3
import unittest
from datetime import datetime, timezone
from snapshot_contract import snapshot_id, assert_shared_snapshot, next_event

class ContractTests(unittest.TestCase):
    def setUp(self):
        self.base={"date":"2026-11-15","group":"1.1","generatedAt":"2026-11-15T20:00:00Z","weather":{"fetchedAt":"2026-11-15T19:50:00Z"},"periods":[{"begin":"00:00","end":"23:00","power":True},{"begin":"23:00","end":"24:00","power":False}]}
    def test_stable_id(self):
        self.assertEqual(snapshot_id(self.base),snapshot_id(dict(reversed(list(self.base.items())))))
    def test_reject_unproven_png(self):
        doc=dict(self.base,snapshotId=snapshot_id(self.base))
        with self.assertRaisesRegex(ValueError,"provenance"):
            assert_shared_snapshot(doc,doc,{"snapshotId":doc["snapshotId"]})
    def test_accept_verified_contract_fixture(self):
        doc=dict(self.base,snapshotId=snapshot_id(self.base))
        self.assertEqual(assert_shared_snapshot(doc,doc,{"snapshotId":doc["snapshotId"],"renderedFromSnapshot":True}),doc["snapshotId"])
    def test_transition_tomorrow(self):
        tomorrow={"date":"2026-11-16","periods":[{"begin":"00:00","end":"06:00","power":False},{"begin":"06:00","end":"24:00","power":True}]}
        event=next_event(self.base,tomorrow,datetime(2026,11,15,21,30,tzinfo=timezone.utc))
        self.assertEqual((event["date"],event["time"],event["power"],event["minutesRemaining"]),("2026-11-16","06:00",True,390))
    def test_midnight_transition(self):
        tomorrow={"date":"2026-11-16","periods":[{"begin":"00:00","end":"24:00","power":True}]}
        event=next_event(self.base,tomorrow,datetime(2026,11,15,21,30,tzinfo=timezone.utc))
        self.assertEqual((event["time"],event["minutesRemaining"]),("00:00",30))
    def test_unknown_tomorrow(self):
        self.assertIsNone(next_event(self.base,None,datetime(2026,11,15,21,30,tzinfo=timezone.utc)))

if __name__=="__main__": unittest.main()
