let ASPNET_MEMBERSHIP = require('../authentication/ASPNET_MEMBERSHIP');
const configJSON = require('../config.json');
let sql = require("mssql");
//
module.exports = class UserDB_MSSQL {
  constructor() {}

  async hasConnection() {
    return await this.getData("select top 1 * from NetUsersProfile");
  }
  //
  async getData(tSQL) {
    try {
      let pool = await sql.connect(configJSON.sqlOptions);
      let result = await pool.request().query(tSQL);
      return Promise.resolve(result.recordset);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  //
  async getAll() {
    return await this.getData("select top 10 * from NetUsersProfile");
  }
  //
  async get(name) {
    if (name && name.length > 1) {
      let user = await this.getData(
        `select top 1 * from NetUsersProfile where email='${name}'`
      );
      if (user && user.length > 0) return user[0];
      else throw Error("user not found");
    }
    throw Error("name is mandatory");
  }
  //
  async getPasswordData(name) {
    if (name && name.length > 1) {
      let user = await this.getData(
        `select top 1 * from aspnet_Membership where Email='${name}'`
      );
      if (user && user.length > 0) return user[0];
      else throw Error(`user ${name} not found`);
    }
    throw Error("name is mandatory");
  }
  //
  async login(name, password) {
    if (password && password.length > 1) {  
      let passwordData = await this.getPasswordData(name);
      if (passwordData) {
        let am = new ASPNET_MEMBERSHIP();
        let passwordSHA1Hash = am.getSHA1Hash(password,passwordData.PasswordSalt);
        if(passwordSHA1Hash===passwordData.Password)
          return 'ok';
        else
          throw Error("passwords dont match");
      }
      else throw Error("user not found");
    }
    throw Error("invalid name or password");
  }
  //
  getBase64String(text){
    const data = atob(text);
    return Uint8Array.from(data, b => b.charCodeAt(0));
  }
  //
  getPaddedUnicodeBytes(text){
    let byteCodes = [...text].map((item)=> item.charCodeAt(0));
    let paddedByteCodes =[];
    for (let index = 0; index < byteCodes.length; index++) {
      paddedByteCodes.push(byteCodes[index]);
      paddedByteCodes.push(0);
    }
    return paddedByteCodes;
  }
  //
  async add(user) {
    if (user.name && user.password) {
      try {
        let created = "01-01-2020"; //new Date().toLocaleDateString();
        let userCreationData = await this.getData(
          `INSERT INTO [dbo].[NetUsersProfile] 
                          ([FullName],[Email],[CountryID],[Password],[Created],[IsActive],[isAdmin],[isConfirmed],[DeviceType])
                            VALUES ( '${user.name}','${user.name}',1,'${user.password}', '${created}', 1, 1, 1,0);
          select @@IDENTITY as UserID`
        );
        if (userCreationData && userCreationData[0].UserID > 0) return user;
        else throw Error("failed to create user");
      } catch (error) {
        throw Error(error);
      }
    } else {
      throw Error("invalid user name or password");
    }
  }
  //
  async delete(name) {
    if (name) {
      let deletedUserData = await this.getData(
        `delete from NetUsersProfile where EMAIL='${name}';select @@ROWCOUNT as [RowCount]`
      );
      if (deletedUserData && deletedUserData[0].RowCount > 0)
        return { name: name };
      else throw Error("Failed to delete user");
    } else {
      throw Error("invalid user name");
    }
  }
};
