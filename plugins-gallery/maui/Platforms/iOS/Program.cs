using ObjCRuntime;
using UIKit;

namespace NapacitorHost.Platforms.iOS;

public class Program
{
    static void Main(string[] args)
    {
        UIApplication.Main(args, null, typeof(AppDelegate));
    }
}
