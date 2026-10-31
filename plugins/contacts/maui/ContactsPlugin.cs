using Microsoft.Maui.ApplicationModel;
// iOS/macOS 上存在命名空间冲突,官方文档要求完全限定或使用别名。
using Communication = Microsoft.Maui.ApplicationModel.Communication;

namespace Napacitor.Plugins.Contacts;

/* ─── 参数 / 结果 DTO ─────────────────────────────────────── */

/// <summary>联系人邮箱(对应 MAUI ContactEmail)。</summary>
public class ContactEmailResult
{
    /// <summary>邮箱地址。</summary>
    public string? EmailAddress { get; set; }
}

/// <summary>联系人电话(对应 MAUI ContactPhone)。</summary>
public class ContactPhoneResult
{
    /// <summary>电话号码。</summary>
    public string? PhoneNumber { get; set; }
}

/// <summary>联系人信息(对应 MAUI Contact)。</summary>
public class ContactInfoResult
{
    /// <summary>联系人 ID。</summary>
    public string? Id { get; set; }

    /// <summary>显示名(未设置时由姓名推断)。</summary>
    public string? DisplayName { get; set; }

    /// <summary>名前缀(如 'Dr.')。</summary>
    public string? NamePrefix { get; set; }

    /// <summary>名。</summary>
    public string? GivenName { get; set; }

    /// <summary>中间名。</summary>
    public string? MiddleName { get; set; }

    /// <summary>姓。</summary>
    public string? FamilyName { get; set; }

    /// <summary>名后缀(如 'Jr.')。</summary>
    public string? NameSuffix { get; set; }

    /// <summary>邮箱列表。</summary>
    public List<ContactEmailResult>? Emails { get; set; }

    /// <summary>电话列表。</summary>
    public List<ContactPhoneResult>? Phones { get; set; }
}

/* ─── 插件主体 ─────────────────────────────────────────────── */

/// <summary>
/// Contacts 插件:读取全部联系人与系统联系人选择器
/// (封装 MAUI Contacts API)。
/// </summary>
[NapacitorPlugin("Contacts")]
public class ContactsPlugin : NapacitorPluginBase
{
    /// <summary>获取设备上的全部联系人(权限拒绝时抛错)。</summary>
    [NapacitorMethod]
    public async Task<ContactInfoResult[]> GetContacts()
    {
        IEnumerable<Communication.Contact>? contacts;
        try
        {
            contacts = await Communication.Contacts.Default.GetAllAsync();
        }
        catch (Exception ex) when (ex is not NapacitorException)
        {
            throw new NapacitorException(
                NapacitorException.Error,
                $"Contacts:读取联系人失败({ex.Message})",
                ex);
        }

        if (contacts is null)
        {
            return Array.Empty<ContactInfoResult>();
        }

        return contacts
            .Where(contact => contact is not null)
            .Select(ToResult)
            .ToArray();
    }

    /// <summary>打开系统联系人选择器选取单个联系人(取消返回 null;Windows 不支持)。</summary>
    [NapacitorMethod]
    public async Task<ContactInfoResult?> PickContact()
    {
        // MAUI 官方文档:Windows 不支持选取联系人。
        if (OperatingSystem.IsWindows())
        {
            throw new NapacitorException(
                NapacitorException.Unsupported,
                "Contacts:Windows 不支持选取联系人");
        }

        Communication.Contact? contact = await MainThread.InvokeOnMainThreadAsync(() =>
            Communication.Contacts.Default.PickContactAsync());
        return contact is null ? null : ToResult(contact);
    }

    /* ─── 内部工具 ─────────────────────────────────────────── */

    private static ContactInfoResult ToResult(Communication.Contact contact) => new()
    {
        Id = contact.Id,
        DisplayName = contact.DisplayName,
        NamePrefix = contact.NamePrefix,
        GivenName = contact.GivenName,
        MiddleName = contact.MiddleName,
        FamilyName = contact.FamilyName,
        NameSuffix = contact.NameSuffix,
        Emails = contact.Emails
            ?.Select(email => new ContactEmailResult { EmailAddress = email.EmailAddress })
            .ToList(),
        Phones = contact.Phones
            ?.Select(phone => new ContactPhoneResult { PhoneNumber = phone.PhoneNumber })
            .ToList(),
    };
}
