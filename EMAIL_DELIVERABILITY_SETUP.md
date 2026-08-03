# Email Deliverability Setup Guide for Boise Remodeling Co

## Overview
This guide ensures your emails reach customers' inboxes instead of spam folders. Proper email authentication is **critical** for deliverability.

---

## 🔴 CRITICAL: DNS Authentication Required

Your emails are going to spam because **SPF, DKIM, and DMARC are not properly configured** on your `boiseremodeling.co` domain. This setup is **mandatory** for inbox delivery in 2025.

### What Each Protocol Does:
- **SPF**: Confirms your identity by authorizing which servers can send email from your domain
- **DKIM**: Ensures emails aren't tampered with during transmission (adds digital signature)
- **DMARC**: Leverages both SPF and DKIM, tells receiving servers what to do with unauthenticated emails

---

## Step 1: Configure Resend DNS Records

### 1.1 Access Your DNS Provider
Log into your domain registrar or DNS provider (GoDaddy, Namecheap, Cloudflare, etc.) for `boiseremodeling.co`.

### 1.2 Add DKIM Records
Resend provides DKIM automatically. You need to add these DNS records:

**Get your DKIM records from Resend:**
1. Log into [Resend Dashboard](https://resend.com/domains)
2. Select your domain `boiseremodeling.co`
3. Copy the DKIM DNS records provided (usually 3 CNAME records)

**Example DKIM records (yours will be different):**
```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.boiseremodeling.co.at.resend.com
TTL: 3600

Type: CNAME
Name: resend2._domainkey
Value: resend2._domainkey.boiseremodeling.co.at.resend.com
TTL: 3600

Type: CNAME
Name: resend3._domainkey
Value: resend3._domainkey.boiseremodeling.co.at.resend.com
TTL: 3600
```

### 1.3 Add SPF Record
Add or update your SPF record to authorize Resend to send emails on your behalf.

**If you already have an SPF record:**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:amazonses.com include:_spf.resend.com ~all
TTL: 3600
```

**If you don't have an SPF record:**
```
Type: TXT
Name: @ (or leave blank)
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

⚠️ **Important**: Only ONE SPF record allowed per domain! If you have existing SPF, append `include:_spf.resend.com` to it.

### 1.4 Add DMARC Record
DMARC tells email providers what to do with unauthenticated emails.

**Start with monitoring mode (p=none):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@boiseremodeling.co; ruf=mailto:dmarc@boiseremodeling.co; fo=1; adkim=s; aspf=s
TTL: 3600
```

**After 2-4 weeks of monitoring, upgrade to quarantine:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@boiseremodeling.co; ruf=mailto:dmarc@boiseremodeling.co; fo=1; adkim=s; aspf=s; pct=25
TTL: 3600
```

**After 2 more weeks, upgrade to reject:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=reject; rua=mailto:dmarc@boiseremodeling.co; ruf=mailto:dmarc@boiseremodeling.co; fo=1; adkim=s; aspf=s; pct=100
TTL: 3600
```

---

## Step 2: Verify DNS Configuration

### 2.1 Check Resend Dashboard
1. Go to [Resend Domains](https://resend.com/domains)
2. Select `boiseremodeling.co`
3. Verify all records show green checkmarks
4. DNS propagation can take 24-48 hours

### 2.2 Use Online Tools
Check your configuration with these tools:
- **MXToolbox SPF Check**: https://mxtoolbox.com/spf.aspx
- **MXToolbox DMARC Check**: https://mxtoolbox.com/dmarc.aspx
- **DKIM Validator**: https://dkimvalidator.com/
- **Mail-Tester**: https://www.mail-tester.com/ (send test email, get spam score)

---

## Step 3: Monitor Email Deliverability

### 3.1 Google Postmaster Tools
Set up [Google Postmaster Tools](https://postmaster.google.com/) to monitor:
- Domain reputation
- IP reputation
- Spam rate
- Authentication success rate

### 3.2 Key Metrics to Track
- **Bounce rate**: Keep < 2%
- **Spam complaint rate**: Keep < 0.1%
- **Open rate**: Aim for > 20%
- **Click rate**: Aim for > 2%

---

## Step 4: Email Content Best Practices

### 4.1 Avoid Spam Triggers
❌ **Don't use these words/phrases:**
- "FREE", "CLICK NOW", "ACT FAST", "GUARANTEED"
- All caps subject lines
- Excessive exclamation marks!!!
- Misleading subject lines

✅ **Do use:**
- Clear, honest subject lines
- Professional language
- Balanced text-to-HTML ratio
- Proper grammar and spelling

### 4.2 Technical Requirements
- ✅ Proper HTML structure (DOCTYPE, head, body)
- ✅ Alt text for all images
- ✅ Maximum email size: 100KB HTML
- ✅ Image sizes: < 200KB each
- ✅ Text-to-image ratio: 60% text minimum
- ✅ Unsubscribe link (legally required for marketing emails)

---

## Step 5: Sending Practices

### 5.1 Warm Up Your Domain (If New)
If you're starting to send emails from a new domain:
- Day 1-3: Send 50-100 emails/day to engaged users
- Day 4-7: Send 200-300 emails/day
- Week 2: Send 500-750 emails/day
- Week 3-4: Gradually increase to target volume

### 5.2 List Hygiene
- ✅ Never buy email lists
- ✅ Use double opt-in
- ✅ Remove hard bounces immediately
- ✅ Clean unengaged subscribers quarterly
- ✅ Segment your audience for relevance

---

## Current Status: Email Branding Unified

### What Was Fixed:
1. **Shared email layout** in `server/services/emailLayout.ts` — text-based logo matching the public site (charcoal + ochre palette)
2. **Plain-text parts** added to all Resend sends for deliverability and accessibility
3. **HTML escaping** applied to user-provided content in templates
4. **From / reply-to / admin notifications** use `hello@boiseremodeling.co` (`PLATFORM_EMAIL` in `emailLayout.ts`)

### Email modules:
- `server/services/emailLayout.ts` — shared layout, branding, escaping
- `server/services/emailNotifications.ts` — lead marketplace and admin emails
- `lib/resend.ts` — quote form emails
- `server/services/complianceEmails.ts` — compliance, contract, and project emails

### Cron routes (set `CRON_SECRET` and schedule in production):
- `GET|POST /api/cron/compliance-reminders` — compliance document reminders
- `GET|POST /api/cron/lead-price-updates` — lead price reductions + watcher notifications
- `GET|POST /api/cron/admin-lead-reminders` — admin digest, pending reminders, auto-decline after 48h

---

## Testing Checklist

Before sending to customers:
- [ ] All DNS records added and verified (green checkmarks in Resend)
- [ ] SPF record includes Resend
- [ ] DKIM records properly configured
- [ ] DMARC policy set (start with p=none)
- [ ] Test email sent to Gmail - check inbox vs spam
- [ ] Test email sent to Outlook - check inbox vs spam
- [ ] Images load correctly in email
- [ ] No broken links
- [ ] Unsubscribe link works (for marketing emails)
- [ ] Spam score < 3 on Mail-Tester.com

---

## Quick Action Items (Priority Order)

### Immediate (Do Today):
1. ✅ **Fix image URLs** - COMPLETED
2. 🔴 **Add DNS records** - Add SPF, DKIM, DMARC to your domain DNS
3. 🔴 **Verify in Resend** - Check all records show green

### This Week:
4. Test emails with Mail-Tester.com
5. Monitor Gmail Postmaster Tools
6. Review bounce/spam complaint rates

### Ongoing:
7. Maintain list hygiene
8. Monitor DMARC reports
9. Gradually tighten DMARC policy (none → quarantine → reject)

---

## Support Resources

- **Resend Documentation**: https://resend.com/docs
- **Resend DNS Setup**: https://resend.com/docs/dashboard/domains/introduction
- **Email Authentication Guide**: https://resend.com/docs/dashboard/domains/authentication
- **DMARC Analyzer**: https://dmarcian.com/
- **Mail-Tester**: https://www.mail-tester.com/

---

## Need Help?

If emails still go to spam after completing all steps:
1. Check all DNS records are properly configured (24-48 hours for propagation)
2. Send test email to Mail-Tester.com and review the report
3. Review Resend dashboard for authentication status
4. Check Google Postmaster Tools for reputation issues
5. Contact Resend support with your test results

---

**Last Updated**: November 24, 2025
**Status**: Images fixed ✅ | DNS authentication pending 🔴
