using System;

namespace PosVentasEspeciales.Models
{
    public class User
    {
        public string id { get; set; }
        public string username { get; set; }
        public string name { get; set; }
        public string role { get; set; }
        public string token { get; set; }

        public static User DefaultUser
        {
            get
            {
                return new User
                {
                    id = "u-admin",
                    username = "admin",
                    name = "ADMINISTRADOR",
                    role = "ADMIN"
                };
            }
        }

        public override string ToString()
        {
            return string.Format("{0} ({1})", name ?? username, role ?? "CAJERO");
        }
    }

    public class LoginRequest
    {
        public string username { get; set; }
        public string password { get; set; }
    }

    public class LoginResponse
    {
        public string token { get; set; }
        public User user { get; set; }
        public string error { get; set; }
    }
}
