#!/usr/bin/env python3
"""
Adversarial Empirical Verification & Challenge Suite (Gen2)
Student Community Platform API & Security

Target: http://localhost:3333
Tests:
- Full RBAC Matrix (Unauth, Member vs Owner, Role Management, Owner Leave Guard)
- Cookie Lifecycle (HttpOnly flag, pure cookie, pure bearer, tampered cookie, logout clearance)
- Profile Updates and retrieval persistence
- Resource domain filtering and URL validation
- High-concurrency monotonic upvoting stress test
- Zero demo data audit
- Edge cases and vulnerability enumeration
"""

import sys
import time
import json
import random
import string
import requests
import sqlite3
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_URL = "http://localhost:3333"

class TestReporter:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        self.findings = []

    def assert_eq(self, test_name, actual, expected, details=""):
        passed = (actual == expected)
        if passed:
            self.passed += 1
            print(f"  [PASS] {test_name} (Got: {actual}) {details}")
        else:
            self.failed += 1
            print(f"  [FAIL] {test_name} (Expected: {expected}, Got: {actual}) {details}")
        self.results.append({
            "test": test_name,
            "passed": passed,
            "actual": actual,
            "expected": expected,
            "details": details
        })
        return passed

    def assert_in(self, test_name, member, container, details=""):
        passed = (member in container)
        if passed:
            self.passed += 1
            print(f"  [PASS] {test_name} (Found '{member}' in response) {details}")
        else:
            self.failed += 1
            print(f"  [FAIL] {test_name} (NOT Found '{member}') {details}")
        self.results.append({
            "test": test_name,
            "passed": passed,
            "actual": str(member),
            "expected": f"in {type(container).__name__}",
            "details": details
        })
        return passed

    def record_finding(self, title, severity, details):
        self.warnings += 1
        print(f"\n  >>> [VULNERABILITY/DEFECT FINDING - {severity.upper()}] {title}")
        print(f"      {details}\n")
        self.findings.append({
            "title": title,
            "severity": severity,
            "details": details
        })

    def summary(self):
        print("\n" + "=" * 70)
        print(f"TEST EXECUTION SUMMARY: Total={len(self.results)}, Passed={self.passed}, Failed={self.failed}, Defect Findings={len(self.findings)}")
        print("=" * 70)
        return self.failed == 0

def rand_str(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def extract_user_and_token(data):
    """Handles both serialized {data: {user, token}} and flat {user, token} schemas."""
    root = data.get("data", data) if isinstance(data, dict) else {}
    user = root.get("user", root) if isinstance(root, dict) else {}
    token = root.get("token") or data.get("token")
    user_id = user.get("id") if isinstance(user, dict) else None
    return user_id, token, user

def run_tests():
    reporter = TestReporter()
    print("======================================================================")
    print("STARTING EMPIRICAL ADVERSARIAL CHALLENGE SUITE (GEN2)")
    print(f"Target: {BASE_URL}")
    print("======================================================================\n")

    # -------------------------------------------------------------------------
    # PART 1: ZERO INITIAL DEMO DATA & CODE AUDIT
    # -------------------------------------------------------------------------
    print(">>> PART 1: Zero Initial Demo Data Check & Static Code Audits")
    try:
        res = requests.get(f"{BASE_URL}/api/v1/communities")
        reporter.assert_eq("GET /communities returns 200", res.status_code, 200)
        comms = res.json()
        print(f"    Current communities in DB: {len(comms)}")
        
        res_r = requests.get(f"{BASE_URL}/api/v1/resources")
        reporter.assert_eq("GET /resources returns 200", res_r.status_code, 200)
        resources = res_r.json()
        print(f"    Current resources in DB: {len(resources)}")

        # Check DB directly for demo users
        con = sqlite3.connect("backend/tmp/db.sqlite3")
        cur = con.cursor()
        users = cur.execute("SELECT id, email, username FROM users WHERE email LIKE '%alex%' OR username LIKE '%alex%' OR email LIKE '%demo%'").fetchall()
        reporter.assert_eq("Zero hardcoded 'alex' or 'demo' users in database", len(users), 0, f"Found: {users}")
    except Exception as e:
        reporter.assert_eq("Database check", str(e), "", "Exception occurred")

    # Setup temporary community and channel to test unauthenticated access against existing channels
    uid = rand_str(6)
    temp_s = requests.Session()
    r_init = temp_s.post(f"{BASE_URL}/api/v1/auth/signup", json={
        "fullName": f"Probe User {uid}",
        "email": f"probe_{uid}@test.edu",
        "password": "Password123!",
        "domainInterests": "Cybersecurity"
    })
    r_init_comm = temp_s.post(f"{BASE_URL}/api/v1/communities", json={
        "name": f"Probe Hub {uid}",
        "domainTag": "Cybersecurity"
    })
    existing_comm_id = r_init_comm.json().get("id")
    existing_ch_id = r_init_comm.json().get("channels", [{}])[0].get("id")

    # -------------------------------------------------------------------------
    # PART 2: UNAUTHENTICATED REQUESTS MATRIX (MUST RETURN 401 UNAUTHORIZED)
    # -------------------------------------------------------------------------
    print("\n>>> PART 2: Full Unauthenticated Access Rejection Matrix (401)")
    unauth_endpoints = [
        ("GET", f"{BASE_URL}/api/v1/auth/me", None),
        ("GET", f"{BASE_URL}/api/v1/auth/profile", None),
        ("PUT", f"{BASE_URL}/api/v1/auth/profile", {"fullName": "Hacker"}),
        ("POST", f"{BASE_URL}/api/v1/auth/logout", {}),
        ("GET", f"{BASE_URL}/api/v1/account/profile", None),
        ("PUT", f"{BASE_URL}/api/v1/account/profile", {"fullName": "Hacker"}),
        ("POST", f"{BASE_URL}/api/v1/account/logout", {}),
        ("POST", f"{BASE_URL}/api/v1/communities", {"name": "Hacked", "domainTag": "AI"}),
        ("PUT", f"{BASE_URL}/api/v1/communities/{existing_comm_id}", {"name": "Hacked"}),
        ("DELETE", f"{BASE_URL}/api/v1/communities/{existing_comm_id}", None),
        ("POST", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/join", None),
        ("POST", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/leave", None),
        ("DELETE", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/leave", None),
        ("DELETE", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/members/1", None),
        ("PUT", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/members/1", {"role": "owner"}),
        ("POST", f"{BASE_URL}/api/v1/communities/{existing_comm_id}/channels", {"name": "hacked"}),
        ("DELETE", f"{BASE_URL}/api/v1/channels/{existing_ch_id}", None),
        ("POST", f"{BASE_URL}/api/v1/channels/{existing_ch_id}/messages", {"content": "Unauthorized message"}),
        ("POST", f"{BASE_URL}/api/v1/resources", {"title": "X", "url": "https://example.com"}),
    ]

    for method, url, payload in unauth_endpoints:
        path = url.replace(BASE_URL, "")
        test_name = f"Unauth {method} {path} returns 401"
        try:
            if method == "GET":
                r = requests.get(url)
            elif method == "POST":
                r = requests.post(url, json=payload)
            elif method == "PUT":
                r = requests.put(url, json=payload)
            elif method == "DELETE":
                r = requests.delete(url)
            reporter.assert_eq(test_name, r.status_code, 401, f"Response: {r.text[:80]}")
        except Exception as e:
            reporter.assert_eq(test_name, str(e), "401", "Request error")

    # EMPIRICAL ADVERSARIAL FINDING TEST: Channel ID Enumeration via status discrepancy
    r_nonexistent_ch = requests.post(f"{BASE_URL}/api/v1/channels/999999/messages", json={"content": "probe"})
    if r_nonexistent_ch.status_code == 404:
        reporter.record_finding(
            "Channel ID Enumeration & Pre-Auth Information Disclosure in MessagesController",
            "Medium",
            f"Unauthenticated request to existing channel ({existing_ch_id}) returns HTTP 401, while request to non-existent channel (999999) returns HTTP 404 ({r_nonexistent_ch.text}). An attacker can enumerate channel IDs without credentials."
        )

    # Clean up probe community
    temp_s.delete(f"{BASE_URL}/api/v1/communities/{existing_comm_id}")

    # -------------------------------------------------------------------------
    # PART 3: HTTPONLY COOKIE & BEARER HEADER AUTHENTICATION LIFECYCLE
    # -------------------------------------------------------------------------
    print("\n>>> PART 3: HttpOnly Cookie & Bearer Header Authentication Lifecycle")
    user_a_email = f"challenger_a_{uid}@test.edu"
    user_a_pass = "SecurePass123!"
    user_a_name = f"Challenger Alice {uid}"

    # 3.1 Signup User A
    s_cookie = requests.Session()
    res = s_cookie.post(f"{BASE_URL}/api/v1/auth/signup", json={
        "fullName": user_a_name,
        "email": user_a_email,
        "password": user_a_pass,
        "domainInterests": "Cybersecurity"
    })
    reporter.assert_eq("User A signup returns 201/200", res.status_code in [200, 201], True)
    user_a_id, raw_token_a, user_a_data = extract_user_and_token(res.json())
    reporter.assert_eq("User A ID extracted", user_a_id is not None, True, f"User ID: {user_a_id}")
    reporter.assert_eq("Raw Token extracted", raw_token_a is not None, True)

    set_cookie_header = res.headers.get("Set-Cookie", "")
    reporter.assert_in("Signup emits auth_token cookie", "auth_token=", set_cookie_header)
    reporter.assert_in("Signup cookie is HttpOnly", "HttpOnly", set_cookie_header)

    # 3.2 Pure Cookie Auth (No Authorization header)
    s_cookie.headers.pop("Authorization", None)
    res_me_cookie = s_cookie.get(f"{BASE_URL}/api/v1/auth/me")
    reporter.assert_eq("Pure Cookie Auth GET /auth/me returns 200", res_me_cookie.status_code, 200)
    _, _, me_cookie_user = extract_user_and_token(res_me_cookie.json())
    reporter.assert_eq("Cookie Auth returns correct user ID", me_cookie_user.get("id"), user_a_id)

    # 3.3 Pure Bearer Header Auth (Fresh session with ZERO cookies)
    s_bearer = requests.Session()
    s_bearer.cookies.clear()
    s_bearer.headers.update({"Authorization": f"Bearer {raw_token_a}"})
    res_me_bearer = s_bearer.get(f"{BASE_URL}/api/v1/auth/me")
    reporter.assert_eq("Pure Bearer Header Auth GET /auth/me returns 200", res_me_bearer.status_code, 200)
    _, _, me_bearer_user = extract_user_and_token(res_me_bearer.json())
    reporter.assert_eq("Bearer Auth returns correct user ID", me_bearer_user.get("id"), user_a_id)

    # 3.4 Tampered Cookie Auth (Must return 401)
    s_tampered = requests.Session()
    s_tampered.cookies.set("auth_token", "tampered_fake_signature_token_0987654321", path="/")
    res_tampered = s_tampered.get(f"{BASE_URL}/api/v1/auth/me")
    reporter.assert_eq("Tampered Cookie GET /auth/me returns 401", res_tampered.status_code, 401)

    # 3.5 Tampered Bearer Header (Must return 401)
    res_bad_bearer = requests.get(f"{BASE_URL}/api/v1/auth/me", headers={"Authorization": "Bearer fake_token_bad"})
    reporter.assert_eq("Tampered Bearer header GET /auth/me returns 401", res_bad_bearer.status_code, 401)

    # -------------------------------------------------------------------------
    # PART 4: PROFILE UPDATE & RETRIEVAL VERIFICATION
    # -------------------------------------------------------------------------
    print("\n>>> PART 4: Profile Management (PUT /api/v1/auth/profile & GET /api/v1/auth/me)")
    updated_bio = f"Elite security researcher {uid}"
    updated_name = f"Alice Hardened {uid}"
    updated_avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    res_profile_update = s_cookie.put(f"{BASE_URL}/api/v1/auth/profile", json={
        "fullName": updated_name,
        "bio": updated_bio,
        "avatarUrl": updated_avatar,
        "domainInterests": "Cybersecurity, AI/ML"
    })
    reporter.assert_eq("PUT /auth/profile returns 200", res_profile_update.status_code, 200)
    _, _, profile_data = extract_user_and_token(res_profile_update.json())
    reporter.assert_eq("Profile update reflected fullName", profile_data.get("fullName"), updated_name)
    reporter.assert_eq("Profile update reflected bio", profile_data.get("bio"), updated_bio)

    # Verify persistence via GET /auth/me
    res_me_check = s_cookie.get(f"{BASE_URL}/api/v1/auth/me")
    _, _, me_persisted = extract_user_and_token(res_me_check.json())
    reporter.assert_eq("GET /auth/me reflects persisted bio", me_persisted.get("bio"), updated_bio)
    reporter.assert_eq("GET /auth/me reflects persisted fullName", me_persisted.get("fullName"), updated_name)

    # -------------------------------------------------------------------------
    # PART 5: ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
    # -------------------------------------------------------------------------
    print("\n>>> PART 5: Role-Based Access Control (RBAC) Matrix")
    # Setup: User A is Owner, User B is Regular Member, User C is 3rd Party
    user_b_email = f"challenger_b_{uid}@test.edu"
    user_b_name = f"Challenger Bob Member {uid}"
    s_bob = requests.Session()
    res_b = s_bob.post(f"{BASE_URL}/api/v1/auth/signup", json={
        "fullName": user_b_name,
        "email": user_b_email,
        "password": user_a_pass,
        "domainInterests": "Web Development"
    })
    reporter.assert_eq("User B (Member) signup returns 201/200", res_b.status_code in [200, 201], True)
    user_b_id, _, _ = extract_user_and_token(res_b.json())
    reporter.assert_eq("User B ID extracted", user_b_id is not None, True, f"User B ID: {user_b_id}")

    # User C
    user_c_email = f"challenger_c_{uid}@test.edu"
    s_charlie = requests.Session()
    res_c = s_charlie.post(f"{BASE_URL}/api/v1/auth/signup", json={
        "fullName": f"Charlie {uid}",
        "email": user_c_email,
        "password": user_a_pass
    })
    user_c_id, _, _ = extract_user_and_token(res_c.json())

    # 5.1 User A creates Community
    comm_name = f"Security Hub {uid}"
    res_comm = s_cookie.post(f"{BASE_URL}/api/v1/communities", json={
        "name": comm_name,
        "domainTag": "Cybersecurity",
        "description": "Adversarial Test Server"
    })
    reporter.assert_eq("Owner User A creates community (HTTP 201)", res_comm.status_code, 201)
    comm_obj = res_comm.json()
    comm_id = comm_obj.get("id")
    reporter.assert_eq("Community ownerId matches User A", comm_obj.get("ownerId"), user_a_id)

    # Auto-created default channel
    default_channels = comm_obj.get("channels", [])
    gen_channel = next((c for c in default_channels if c.get("name") == "general-discussion"), None)
    gen_channel_id = gen_channel.get("id") if gen_channel else None
    reporter.assert_eq("Auto-created general-discussion channel exists", gen_channel_id is not None, True)

    # 5.2 User B joins Community as Regular Member
    res_join = s_bob.post(f"{BASE_URL}/api/v1/communities/{comm_id}/join")
    reporter.assert_eq("User B joins community returns 201", res_join.status_code, 201)
    reporter.assert_eq("User B role is 'member'", res_join.json().get("role"), "member")

    # User C also joins Community
    s_charlie.post(f"{BASE_URL}/api/v1/communities/{comm_id}/join")

    # 5.3 ADVERSARIAL CHALLENGE: Regular Member User B attempts OWNER OPERATIONS (MUST ALL RETURN 403)
    print("  * Adversarial Challenge: Member User B attempts forbidden owner operations...")
    
    # 5.3.1 Delete Community
    res_b_del_comm = s_bob.delete(f"{BASE_URL}/api/v1/communities/{comm_id}")
    reporter.assert_eq("Member DELETE community returns 403 Forbidden", res_b_del_comm.status_code, 403)

    # 5.3.2 Edit Community Profile
    res_b_edit_comm = s_bob.put(f"{BASE_URL}/api/v1/communities/{comm_id}", json={
        "name": f"Defaced by Bob {uid}",
        "domainTag": "Hacked"
    })
    reporter.assert_eq("Member PUT community profile returns 403 Forbidden", res_b_edit_comm.status_code, 403)

    # 5.3.3 Create Channel
    res_b_create_ch = s_bob.post(f"{BASE_URL}/api/v1/communities/{comm_id}/channels", json={
        "name": "bob-secret-room",
        "type": "text"
    })
    reporter.assert_eq("Member POST channel returns 403 Forbidden", res_b_create_ch.status_code, 403)

    # 5.3.4 Delete Channel
    if gen_channel_id:
        res_b_del_ch = s_bob.delete(f"{BASE_URL}/api/v1/channels/{gen_channel_id}")
        reporter.assert_eq("Member DELETE channel returns 403 Forbidden", res_b_del_ch.status_code, 403)

    # 5.3.5 Promote/Demote Member Role
    res_b_promote = s_bob.put(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_b_id}", json={
        "role": "owner"
    })
    reporter.assert_eq("Member PUT member role (privilege escalation) returns 403 Forbidden", res_b_promote.status_code, 403)

    # 5.3.6 Kick Owner
    res_b_kick_owner = s_bob.delete(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_a_id}")
    reporter.assert_eq("Member DELETE member (kick owner) returns 403 Forbidden", res_b_kick_owner.status_code, 403)

    # 5.3.7 Kick Another Member (Charlie)
    res_b_kick_c = s_bob.delete(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_c_id}")
    reporter.assert_eq("Member DELETE other member returns 403 Forbidden", res_b_kick_c.status_code, 403)

    # 5.4 OWNER OPERATIONS (MUST SUCCEED 200/201)
    print("  * Owner Operations: Owner User A executes operations...")

    # 5.4.1 Owner creates Channel
    res_a_ch = s_cookie.post(f"{BASE_URL}/api/v1/communities/{comm_id}/channels", json={
        "name": "announcements",
        "type": "text",
        "topic": "Official community announcements"
    })
    reporter.assert_eq("Owner creates channel returns 201", res_a_ch.status_code, 201)
    ann_channel_id = res_a_ch.json().get("id")

    # 5.4.2 Owner edits Community Profile
    res_a_edit = s_cookie.put(f"{BASE_URL}/api/v1/communities/{comm_id}", json={
        "name": f"Security Hub Enhanced {uid}",
        "description": "Updated description by Owner",
        "domainTag": "Cybersecurity"
    })
    reporter.assert_eq("Owner updates community returns 200", res_a_edit.status_code, 200)
    reporter.assert_eq("Updated name verified", res_a_edit.json().get("name"), f"Security Hub Enhanced {uid}")

    # 5.4.3 Owner Promotes Bob to Admin
    res_a_prom = s_cookie.put(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_b_id}", json={
        "role": "admin"
    })
    reporter.assert_eq("Owner promotes Bob to admin returns 200", res_a_prom.status_code, 200)
    reporter.assert_eq("Bob's new role is admin", res_a_prom.json().get("role"), "admin")

    # 5.4.4 Owner Demotes Bob back to Member
    res_a_dem = s_cookie.put(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_b_id}", json={
        "role": "member"
    })
    reporter.assert_eq("Owner demotes Bob back to member returns 200", res_a_dem.status_code, 200)
    reporter.assert_eq("Bob's new role is member", res_a_dem.json().get("role"), "member")

    # 5.4.5 Owner Kicks Member Charlie
    res_a_kick_c = s_cookie.delete(f"{BASE_URL}/api/v1/communities/{comm_id}/members/{user_c_id}")
    reporter.assert_eq("Owner kicks Charlie returns 200", res_a_kick_c.status_code, 200)

    # 5.4.6 Owner Deletes Created Channel
    res_a_del_ch = s_cookie.delete(f"{BASE_URL}/api/v1/channels/{ann_channel_id}")
    reporter.assert_eq("Owner deletes channel returns 200", res_a_del_ch.status_code, 200)

    # 5.5 OWNER LEAVE GUARD
    print("  * Owner Leave Guard: Owner attempts to leave community...")
    res_owner_leave_post = s_cookie.post(f"{BASE_URL}/api/v1/communities/{comm_id}/leave")
    reporter.assert_eq("Owner POST /leave rejected with 400 Bad Request", res_owner_leave_post.status_code, 400)
    res_owner_leave_del = s_cookie.delete(f"{BASE_URL}/api/v1/communities/{comm_id}/leave")
    reporter.assert_eq("Owner DELETE /leave rejected with 400 Bad Request", res_owner_leave_del.status_code, 400)

    # 5.6 Regular Member leaves community successfully
    res_b_leave = s_bob.delete(f"{BASE_URL}/api/v1/communities/{comm_id}/leave")
    reporter.assert_eq("Member Bob DELETE /leave returns 200 OK", res_b_leave.status_code, 200)

    # 5.7 Owner deletes community
    res_a_del_comm = s_cookie.delete(f"{BASE_URL}/api/v1/communities/{comm_id}")
    reporter.assert_eq("Owner deletes community returns 200 OK", res_a_del_comm.status_code, 200)

    # Verify community deleted
    res_check_del = requests.get(f"{BASE_URL}/api/v1/communities/{comm_id}")
    reporter.assert_eq("Deleted community GET returns 404", res_check_del.status_code, 404)

    # -------------------------------------------------------------------------
    # PART 6: DOMAIN RESOURCE SHARING & TAG FILTERING
    # -------------------------------------------------------------------------
    print("\n>>> PART 6: Domain Resource Sharing, Tag Filtering & Validation")
    # 6.1 URL validation
    res_bad_url = s_cookie.post(f"{BASE_URL}/api/v1/resources", json={
        "title": "Bad URL resource",
        "url": "javascript:alert(1)",
        "domainTag": "Cybersecurity"
    })
    reporter.assert_eq("Invalid URL protocol rejected with 400", res_bad_url.status_code, 400)

    res_no_title = s_cookie.post(f"{BASE_URL}/api/v1/resources", json={
        "url": "https://example.com",
        "domainTag": "Cybersecurity"
    })
    reporter.assert_eq("Missing title rejected with 400", res_no_title.status_code, 400)

    # 6.2 Submit tagged resources
    tags_to_test = ["Artificial Intelligence", "Web Development", "Cybersecurity"]
    created_resource_ids = {}
    for tag in tags_to_test:
        r_post = s_cookie.post(f"{BASE_URL}/api/v1/resources", json={
            "title": f"Study Guide for {tag} {uid}",
            "url": f"https://example.com/{tag.lower().replace(' ', '-')}",
            "description": f"Comprehensive guide to {tag}",
            "domainTag": tag
        })
        reporter.assert_eq(f"Create resource for tag '{tag}' returns 201", r_post.status_code, 201)
        created_resource_ids[tag] = r_post.json().get("id")

    # 6.3 Filter by domain tag
    for tag in tags_to_test:
        res_filter = requests.get(f"{BASE_URL}/api/v1/resources", params={"domain": tag})
        reporter.assert_eq(f"GET /resources?domain={tag} returns 200", res_filter.status_code, 200)
        items = res_filter.json()
        all_match = all(item.get("domainTag") == tag for item in items)
        reporter.assert_eq(f"All resources filtered by '{tag}' match tag exactly", all_match, True, f"Count: {len(items)}")

    # -------------------------------------------------------------------------
    # PART 7: MONOTONIC CONCURRENT UPVOTE STRESS HARNESS
    # -------------------------------------------------------------------------
    print("\n>>> PART 7: Monotonic Concurrent Upvote Stress Harness")
    target_res_id = created_resource_ids["Cybersecurity"]
    # Fetch initial upvote count
    res_initial = requests.get(f"{BASE_URL}/api/v1/resources")
    target_obj = next((r for r in res_initial.json() if r.get("id") == target_res_id), None)
    initial_upvotes = target_obj.get("upvotes", 0) if target_obj else 0
    print(f"    Initial upvotes for resource #{target_res_id}: {initial_upvotes}")

    CONCURRENCY = 25
    print(f"    Firing {CONCURRENCY} concurrent upvote requests via ThreadPoolExecutor...")

    def do_upvote(req_idx):
        t0 = time.time()
        try:
            r = requests.post(f"{BASE_URL}/api/v1/resources/{target_res_id}/upvote", timeout=10)
            elapsed = time.time() - t0
            return {
                "idx": req_idx,
                "status": r.status_code,
                "json": r.json() if r.status_code == 200 else None,
                "elapsed": elapsed,
                "error": None
            }
        except Exception as e:
            return {
                "idx": req_idx,
                "status": None,
                "elapsed": time.time() - t0,
                "error": str(e)
            }

    upvote_results = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(do_upvote, i) for i in range(CONCURRENCY)]
        for f in as_completed(futures):
            upvote_results.append(f.result())

    success_count = sum(1 for res in upvote_results if res["status"] == 200)
    reporter.assert_eq(f"All {CONCURRENCY} concurrent upvote requests succeed (200 OK)", success_count, CONCURRENCY)

    # Check final upvotes
    res_final = requests.get(f"{BASE_URL}/api/v1/resources")
    target_final = next((r for r in res_final.json() if r.get("id") == target_res_id), None)
    final_upvotes = target_final.get("upvotes", 0) if target_final else 0
    print(f"    Final upvotes for resource #{target_res_id}: {final_upvotes} (Initial was {initial_upvotes})")

    # Empirical Monotonicity Check
    monotonic = (final_upvotes > initial_upvotes)
    reporter.assert_eq("Upvote count increased monotonically", monotonic, True, f"Old: {initial_upvotes}, New: {final_upvotes}")

    if final_upvotes == initial_upvotes + CONCURRENCY:
        reporter.assert_eq("Atomic increment precision: Exact match (No lost updates)", final_upvotes, initial_upvotes + CONCURRENCY)
    else:
        lost_updates = (initial_upvotes + CONCURRENCY) - final_upvotes
        reporter.record_finding(
            "Race Condition / Lost Updates Under Concurrent Upvoting",
            "Low",
            f"Expected {initial_upvotes + CONCURRENCY} upvotes, got {final_upvotes} ({lost_updates} updates lost). Controller performs non-atomic read-modify-write (`resource.upvotes = upvotes + 1; await resource.save()`) instead of atomic SQL increment."
        )

    # -------------------------------------------------------------------------
    # PART 8: LOGOUT & TOKEN REVOCATION LIFECYCLE
    # -------------------------------------------------------------------------
    print("\n>>> PART 8: Logout & Token Revocation Lifecycle")
    # Call logout on s_cookie
    res_logout = s_cookie.post(f"{BASE_URL}/api/v1/auth/logout")
    reporter.assert_eq("POST /auth/logout returns 200 OK", res_logout.status_code, 200)
    logout_cookie_header = res_logout.headers.get("Set-Cookie", "")
    reporter.assert_in("Logout clears auth_token cookie", "auth_token=", logout_cookie_header)
    cleared = ("Max-Age=0" in logout_cookie_header or "expires=" in logout_cookie_header.lower() or "auth_token=;" in logout_cookie_header)
    reporter.assert_eq("Cookie header explicitly expires or clears token", cleared, True, f"Header: {logout_cookie_header}")

    # Subsequent request using the revoked Bearer token MUST fail with 401
    res_revoked = s_bearer.get(f"{BASE_URL}/api/v1/auth/me")
    reporter.assert_eq("Revoked Bearer token returns 401 Unauthorized", res_revoked.status_code, 401)

    # -------------------------------------------------------------------------
    # PART 9: EDGE CASES & DEFENSIVE INPUT VALIDATION
    # -------------------------------------------------------------------------
    print("\n>>> PART 9: Edge Cases & Defensive Input Validation")
    # Fresh login for User B to test edge cases
    s_bob_fresh = requests.Session()
    res_login_b = s_bob_fresh.post(f"{BASE_URL}/api/v1/auth/login", json={
        "email": user_b_email,
        "password": user_a_pass
    })
    reporter.assert_eq("User B fresh login returns 200", res_login_b.status_code, 200)

    # Create community for edge case testing
    res_comm_edge = s_bob_fresh.post(f"{BASE_URL}/api/v1/communities", json={
        "name": f"Edge Case Server {uid}",
        "domainTag": "Web Development"
    })
    comm_edge_id = res_comm_edge.json().get("id")

    # 9.1 Owner attempts to kick themselves
    res_self_kick = s_bob_fresh.delete(f"{BASE_URL}/api/v1/communities/{comm_edge_id}/members/{user_b_id}")
    reporter.assert_eq("Owner kicking themselves rejected with 400 Bad Request", res_self_kick.status_code, 400)

    # 9.2 Assign invalid role
    res_invalid_role = s_bob_fresh.put(f"{BASE_URL}/api/v1/communities/{comm_edge_id}/members/{user_b_id}", json={
        "role": "supreme_leader"
    })
    reporter.assert_eq("Assigning invalid role rejected with 400 Bad Request", res_invalid_role.status_code, 400)

    # 9.3 Create channel with empty name
    res_empty_ch = s_bob_fresh.post(f"{BASE_URL}/api/v1/communities/{comm_edge_id}/channels", json={
        "name": ""
    })
    reporter.assert_eq("Creating channel with empty name rejected with 400 Bad Request", res_empty_ch.status_code, 400)

    # 9.4 Empty message content
    edge_channels = res_comm_edge.json().get("channels", [])
    if edge_channels:
        edge_ch_id = edge_channels[0]["id"]
        res_empty_msg = s_bob_fresh.post(f"{BASE_URL}/api/v1/channels/{edge_ch_id}/messages", json={
            "content": "   "
        })
        reporter.assert_eq("Empty/whitespace message content rejected with 400 Bad Request", res_empty_msg.status_code, 400)

    # Cleanup edge community
    s_bob_fresh.delete(f"{BASE_URL}/api/v1/communities/{comm_edge_id}")

    # Output Summary
    success = reporter.summary()
    
    # Save detailed JSON report
    with open(".agents/challenger_gen2_1/test_results.json", "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "total": len(reporter.results),
            "passed": reporter.passed,
            "failed": reporter.failed,
            "warnings": reporter.warnings,
            "findings": reporter.findings,
            "results": reporter.results
        }, f, indent=2)

    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(run_tests())
