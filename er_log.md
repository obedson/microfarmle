PS C:\Users\NITDA\Desktop\microfarm> git add .
warning: in the working copy of 'backend/src/controllers/receiptController.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'backend/src/services/emailService.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'backend/src/services/receiptService.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'frontend/src/components/Header.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'frontend/src/components/bookings/BookingCard.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'frontend/src/pages/Login.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'frontend/src/pages/Payment.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'frontend/src/pages/Register.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'mobile/src/screens/LoginScreen.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'mobile/src/screens/RegisterScreen.tsx', LF will be replaced by CRLF the next time Git touches it
PS C:\Users\NITDA\Desktop\microfarm> git commit -m "feat: platform enhancements - bookings, payments, analytics, receipts, communications"
[main d4f4930] feat: platform enhancements - bookings, payments, analytics, receipts, communications
 19 files changed, 213 insertions(+), 72 deletions(-)
 create mode 100644 jamb/microfarmas-s3_accessKeys.csv
 create mode 100644 rcpt.png
PS C:\Users\NITDA\Desktop\microfarm> git push origin main
Enumerating objects: 66, done.
Counting objects: 100% (66/66), done.
Delta compression using up to 2 threads
Compressing objects: 100% (34/34), done.
Writing objects: 100% (35/35), 97.03 KiB | 2.94 MiB/s, done.
Total 35 (delta 30), reused 0 (delta 0), pack-reused 0 (from 0)
remote: Resolving deltas: 100% (30/30), completed with 30 local objects.
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote:
remote: - GITHUB PUSH PROTECTION
remote:   —————————————————————————————————————————
remote:     Resolve the following violations before pushing again
remote:
remote:     - Push cannot contain secrets
remote:
remote:
remote:      (?) Learn how to resolve a blocked push
remote:      https://docs.github.com/code-security/secret-scanning/working-with-secret-scanning-and-push-protection/working-with-push-protection-from-the-command-line#resolving-a-blocked-push
remote:
remote:
remote:       —— Amazon AWS Access Key ID ——————————————————————————
remote:        locations:
remote:          - commit: d4f493051100fee970d2b1fa3c8326042803dad8
remote:            path: jamb/microfarmas-s3_accessKeys.csv:2
remote:
remote:        (?) To push, remove secret from commit(s) or follow this URL to allow the secret.
remote:        https://github.com/obedson/microfarmle/security/secret-scanning/unblock-secret/3AyrGrq9oLgRPe4x8FcYLFQeqoD
remote:
remote:
remote:       —— Amazon AWS Secret Access Key ——————————————————————
remote:        locations:
remote:          - commit: d4f493051100fee970d2b1fa3c8326042803dad8
remote:            path: jamb/microfarmas-s3_accessKeys.csv:2
remote:
remote:        (?) To push, remove secret from commit(s) or follow this URL to allow the secret.
remote:        https://github.com/obedson/microfarmle/security/secret-scanning/unblock-secret/3AyrGtKbncLQo13Rta2OfUNm8dT
remote:
remote:
remote:
To https://github.com/obedson/microfarmle.git
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/obedson/microfarmle.git'
PS C:\Users\NITDA\Desktop\microfarm>