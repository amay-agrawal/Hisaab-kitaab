import nodemailer from "nodemailer";

/* ─── Transporter ─────────────────────────────────────────────────── */

const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

/* ─── Base HTML Layout ─────────────────────────────────────────────── */

const baseTemplate = (content, previewText = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hisaab-Kitab</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f1f5f9; color: #1e293b; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%); padding: 32px 40px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .logo-icon { width: 36px; height: 36px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .logo-text { color: #fff; font-size: 20px; font-weight: 700; }
    .header-subtitle { color: rgba(255,255,255,0.75); font-size: 13px; margin-top: 4px; }
    .body { padding: 36px 40px; }
    .greeting { font-size: 22px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
    .subtext { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 20px; }
    .card-title { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 12px; }
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    .stat-row:last-child { border-bottom: none; }
    .stat-label { font-size: 14px; color: #475569; }
    .stat-value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .stat-value.green { color: #16a34a; }
    .stat-value.red { color: #dc2626; }
    .stat-value.blue { color: #2563eb; }
    .alert-box { border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; display: flex; gap: 12px; align-items: flex-start; }
    .alert-box.warning { background: #fff7ed; border: 1px solid #fed7aa; }
    .alert-box.danger { background: #fef2f2; border: 1px solid #fecaca; }
    .alert-box.success { background: #f0fdf4; border: 1px solid #bbf7d0; }
    .alert-icon { font-size: 20px; flex-shrink: 0; }
    .alert-content .alert-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .alert-content .alert-desc { font-size: 13px; color: #64748b; line-height: 1.5; }
    .progress-bar-bg { background: #e2e8f0; border-radius: 999px; height: 8px; margin: 8px 0; overflow: hidden; }
    .progress-bar-fill { height: 100%; border-radius: 999px; transition: width 0.3s; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-top: 8px; }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    .category-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 600; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 40px; text-align: center; }
    .footer p { font-size: 12px; color: #94a3b8; line-height: 1.6; }
    .footer a { color: #3b82f6; text-decoration: none; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ""}
  <div class="wrapper">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">💰</div>
        <span class="logo-text">Hisaab-Kitab</span>
      </div>
      <p class="header-subtitle">Your smart financial companion</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>You're receiving this because you enabled email notifications in your account settings.</p>
      <p style="margin-top:6px;">
        <a href="http://localhost:5173/settings">Manage Notifications</a> &nbsp;·&nbsp;
        <a href="http://localhost:5173/dashboard">Open Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>`;

/* ─── Format Currency ──────────────────────────────────────────────── */

const formatINR = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

/* ─── 1. Budget Alert Email ──────────────────────────────────────────── */

export const sendBudgetAlertEmail = async ({ to, userName, category, spent, budget }) => {
    const pct = Math.round((spent / budget) * 100);
    const isOver = spent >= budget;
    const barColor = isOver ? "#dc2626" : "#f97316";

    const content = `
    <p class="greeting">⚠️ Budget ${isOver ? "Exceeded" : "Warning"}, ${userName}!</p>
    <p class="subtext">
      Your spending in <strong>${category}</strong> has ${isOver ? "exceeded" : "reached " + pct + "% of"} your set budget for this month.
    </p>

    <div class="alert-box ${isOver ? "danger" : "warning"}">
      <span class="alert-icon">${isOver ? "🚨" : "⚠️"}</span>
      <div class="alert-content">
        <p class="alert-title">${isOver ? "Budget Exceeded!" : "Approaching Limit"}</p>
        <p class="alert-desc">
          You've spent <strong>${formatINR(spent)}</strong> out of your <strong>${formatINR(budget)}</strong> budget for <strong>${category}</strong>.
          ${isOver ? `You are ${formatINR(spent - budget)} over budget.` : `Only ${formatINR(budget - spent)} remaining.`}
        </p>
      </div>
    </div>

    <div class="card">
      <p class="card-title">Budget Breakdown</p>
      <div class="stat-row">
        <span class="stat-label">Category</span>
        <span class="stat-value"><span class="category-badge">${category}</span></span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Monthly Budget</span>
        <span class="stat-value">${formatINR(budget)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Amount Spent</span>
        <span class="stat-value red">${formatINR(spent)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">${isOver ? "Over Budget" : "Remaining"}</span>
        <span class="stat-value ${isOver ? "red" : "green"}">${isOver ? "−" + formatINR(spent - budget) : formatINR(budget - spent)}</span>
      </div>
    </div>

    <div class="progress-bar-bg">
      <div class="progress-bar-fill" style="width:${Math.min(pct, 100)}%; background:${barColor};"></div>
    </div>
    <p style="font-size:12px;color:#94a3b8;text-align:right;margin-bottom:20px;">${pct}% used</p>

    <a href="http://localhost:5173/budget" class="btn">View Budget Details →</a>
  `;

    return sendEmail({
        to,
        subject: `${isOver ? "🚨 Budget Exceeded" : "⚠️ Budget Warning"} — ${category} (${pct}% used)`,
        html: baseTemplate(content, `Your ${category} budget is at ${pct}%`),
    });
};

/* ─── 2. Weekly Summary Email ─────────────────────────────────────────── */

export const sendWeeklySummaryEmail = async ({ to, userName, income, expense, savings, topCategory, transactionCount, savingsRate }) => {
    const isPositive = savings >= 0;

    const content = `
    <p class="greeting">Your Weekly Financial Summary 📊</p>
    <p class="subtext">
      Here's a quick look at your finances for the past week, ${userName}.
      You had <strong>${transactionCount} transactions</strong> this week.
    </p>

    <div class="card">
      <p class="card-title">This Week's Overview</p>
      <div class="stat-row">
        <span class="stat-label">💚 Total Income</span>
        <span class="stat-value green">${formatINR(income)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">🔴 Total Expenses</span>
        <span class="stat-value red">${formatINR(expense)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">💙 Net Savings</span>
        <span class="stat-value ${isPositive ? "green" : "red"}">${formatINR(savings)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">📈 Savings Rate</span>
        <span class="stat-value blue">${savingsRate}%</span>
      </div>
      ${topCategory ? `
      <div class="stat-row">
        <span class="stat-label">🏆 Top Expense Category</span>
        <span class="stat-value"><span class="category-badge">${topCategory}</span></span>
      </div>` : ""}
    </div>

    <div class="alert-box ${isPositive ? "success" : "warning"}">
      <span class="alert-icon">${isPositive ? "🎉" : "💡"}</span>
      <div class="alert-content">
        <p class="alert-title">${isPositive ? "Great job this week!" : "Spending exceeded income"}</p>
        <p class="alert-desc">
          ${isPositive
            ? `You saved ${formatINR(savings)} this week. Keep it up!`
            : `Your expenses exceeded your income by ${formatINR(Math.abs(savings))}. Consider reviewing your budget.`}
        </p>
      </div>
    </div>

    <a href="http://localhost:5173/analytics" class="btn">View Full Analytics →</a>
  `;

    return sendEmail({
        to,
        subject: `📊 Your Weekly Summary — ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`,
        html: baseTemplate(content, `You saved ${formatINR(savings)} this week`),
    });
};

/* ─── 3. Welcome Email ─────────────────────────────────────────────── */

export const sendWelcomeEmail = async ({ to, userName }) => {
    const content = `
    <p class="greeting">Welcome to Hisaab-Kitab, ${userName}! 🎉</p>
    <p class="subtext">
      We're thrilled to have you on board. Start taking control of your finances with powerful insights, budgets, and a fun leaderboard to keep you motivated.
    </p>

    <div class="card">
      <p class="card-title">Get Started</p>
      <div class="stat-row"><span class="stat-label">📝 Add your first transaction</span><span class="stat-value blue">→</span></div>
      <div class="stat-row"><span class="stat-label">🎯 Set monthly budgets</span><span class="stat-value blue">→</span></div>
      <div class="stat-row"><span class="stat-label">📊 Explore Analytics</span><span class="stat-value blue">→</span></div>
      <div class="stat-row"><span class="stat-label">🏆 Join the Leaderboard</span><span class="stat-value blue">→</span></div>
    </div>

    <a href="http://localhost:5173/dashboard" class="btn">Go to Dashboard →</a>
  `;

    return sendEmail({
        to,
        subject: "🎉 Welcome to Hisaab-Kitab!",
        html: baseTemplate(content, `Hi ${userName}, your account is ready!`),
    });
};

/* ─── 4. Test Email ─────────────────────────────────────────────────── */

export const sendTestEmail = async ({ to, userName }) => {
    const content = `
    <p class="greeting">Email Notifications are Working! ✅</p>
    <p class="subtext">
      Hey ${userName}, this is a test email to confirm that your Hisaab-Kitab email notifications are set up correctly.
    </p>

    <div class="alert-box success">
      <span class="alert-icon">✅</span>
      <div class="alert-content">
        <p class="alert-title">Connection Successful</p>
        <p class="alert-desc">
          Your Gmail is properly connected. You'll now receive budget alerts, weekly summaries, and other important notifications at <strong>${to}</strong>.
        </p>
      </div>
    </div>

    <div class="card">
      <p class="card-title">What You'll Receive</p>
      <div class="stat-row"><span class="stat-label">🚨 Budget Alerts</span><span class="stat-value green">Enabled</span></div>
      <div class="stat-row"><span class="stat-label">📊 Weekly Summaries</span><span class="stat-value green">Every Monday</span></div>
      <div class="stat-row"><span class="stat-label">🏆 Leaderboard Updates</span><span class="stat-value blue">On Rank Change</span></div>
    </div>

    <a href="http://localhost:5173/settings" class="btn">Manage Settings →</a>
  `;

    return sendEmail({
        to,
        subject: "✅ Test Email — Hisaab-Kitab Notifications Working",
        html: baseTemplate(content, "Your email notifications are set up correctly!"),
    });
};

/* ─── Core Send Function ───────────────────────────────────────────── */

const sendEmail = async ({ to, subject, html }) => {
    if (!process.env.GMAIL_USER || process.env.GMAIL_USER === "your_gmail@gmail.com") {
        console.warn("⚠️  Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env");
        return { skipped: true, reason: "Email service not configured" };
    }

    const transporter = createTransporter();
    const fromName = process.env.EMAIL_FROM_NAME || "Hisaab-Kitab";

    const info = await transporter.sendMail({
        from: `"${fromName}" <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
    });

    console.log(`✉️  Email sent to ${to}: ${info.messageId}`);
    return info;
};
