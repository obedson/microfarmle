Frontend stack — what framework is the frontend built with? (React, Next.js, Vue?) I need to explore the frontend directory. Is it in this same repo or a separate one?

Ans: See Frontend E:\microfams\frontend

Group creation threshold change — the current code requires 10 paid referrals to create a group. Prompt2 says "must invite at least 2 paid members." Should this replace the 10-referral requirement, or is this an additional condition on top of it?

Ans:  this Should replace the 10-referral requirement

Profile picture — should users be able to upload a profile picture (stored in S3/Cloudinary, which are already configured in the backend), or just select an avatar?

Ans: users should be able to upload a profile picture stored in S3

"Paid member" for group creation — does "paid member" mean the user has paid the entry fee to join an existing group, or that they have a paid subscription/referral status on the platform?

Ans: "Paid Member" mean the user has paid the entry fee to have a paid subscription/verified status on the platform

In addition: User verification using NIN through Interswitch NIN Verification API should be required during platform subscription or group membership subscription. The user's details pulled from NIN record will be permanently used for the user's profile details and cannot be edited by the user.

Group Dashboard suggestions — here are my recommendations, let me know if you want to adjust:

For Group Admin dashboard: group name/description/stats, member list with statuses, group fund balance + NUBAN, contribution cycle status, pending withdrawal approvals, ability to edit group details, suspend/expel members, create contribution cycles

Approved Suggestions:

 group name/description/stats, member list with statuses, group fund balance + NUBAN, contribution cycle status, pending withdrawal approvals, ability to edit group details (cannot edit financial records such as balance and transaction history, and cannot edit contribution amount once the contribution cycle), suspend/expel members (only by 2/3 of group members vote), create contribution cycles

For Group Member dashboard: group name/description, their own contribution status for the current cycle, group fund balance (read-only), member list (names only), upcoming payment deadline, their membership status

Approved!

 NIN verification requirement

 Should NIN verification be:

Required at registration (no account without NIN), or
Required before group creation/joining (account exists, but NIN needed to unlock group features)?

Ans: NIN verification Should be Required before group creation/joining(account exists, but NIN needed to unlock group features and financial transactions ).

A button to update profile record can be on the dashboard of non-verified users, so that when they click on update profile button redirects to NIN verification page. Once verified, the record replaces the details they provided earlier or during registration. Also create the likely field expected from NIN records which can be null pending NIN Profile Update

Little Adjustment: Instead of a button to update profile record to be on the dashboard of non-verified users, "Become a Memeber" button should be on the dashboard of non-verified users, when clicked redirect to a multi-step group joining form: Pay group joining fee -> Payment Confirmed -> Enter NIN and date of birth -> NIN verified -> Record updated -> Access granted. Also "Become a Memeber" button call-to-action can be on any other section or page of the platform wherever necessary.