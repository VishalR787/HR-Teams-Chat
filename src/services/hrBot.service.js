/**
 * HR Bot Service - Handles slash commands
 */

export class HRBotService {
  /**
   * Process a message and check if it's a command
   * @param {string} text - Message text
   * @param {Object} user - User object with name and role
   * @returns {Object|null} Bot response or null if not a command
   */
  processCommand(text, user) {
    if (!text.startsWith('/')) {
      return null;
    }

    const command = text.toLowerCase().trim();

    // /leave balance
    if (command === '/leave balance') {
      return this.getLeaveBalance(user);
    }

    // /payslip <Month> 2025
    const payslipMatch = command.match(/^\/payslip\s+(\w+)\s+(\d{4})$/);
    if (payslipMatch) {
      const [, month, year] = payslipMatch;
      return this.getPayslip(user, month, year);
    }

    // /apply leave <N> days from <YYYY-MM-DD>
    const leaveMatch = command.match(/^\/apply leave\s+(\d+)\s+days? from\s+(\d{4}-\d{2}-\d{2})$/);
    if (leaveMatch) {
      const [, days, startDate] = leaveMatch;
      return this.applyLeave(user, parseInt(days), startDate);
    }

    // Unknown command
    return {
      user: 'HR-Bot',
      role: 'system',
      text: `Unknown command. Available commands:\n• /leave balance\n• /payslip <Month> 2025\n• /apply leave <N> days from <YYYY-MM-DD>`,
      createdAt: new Date()
    };
  }

  /**
   * Get leave balance
   */
  getLeaveBalance(user) {
    const casualLeaves = Math.floor(Math.random() * 15) + 5;
    const earnedLeaves = Math.floor(Math.random() * 5) + 1;

    return {
      user: 'HR-Bot',
      role: 'system',
      text: `You have ${casualLeaves} casual leaves and ${earnedLeaves} earned leaves left.`,
      createdAt: new Date()
    };
  }

  /**
   * Get payslip link
   */
  getPayslip(user, month, year) {
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
    const link = `https://intranet.example.com/payslip/${user.name.toLowerCase().replace(/\s+/g, '-')}/${capitalizedMonth}-${year}`;

    return {
      user: 'HR-Bot',
      role: 'system',
      text: `Your payslip for ${capitalizedMonth} ${year} is available at: ${link}`,
      createdAt: new Date()
    };
  }

  /**
   * Apply for leave
   */
  applyLeave(user, days, startDate) {
    return {
      user: 'HR-Bot',
      role: 'system',
      text: `Leave request submitted: ${days} day(s) starting from ${startDate}. Your request will be reviewed by HR.`,
      createdAt: new Date()
    };
  }
}

export const hrBotService = new HRBotService();
