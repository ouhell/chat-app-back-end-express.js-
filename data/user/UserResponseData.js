class UserResponseData {
  constructor(user) {
    this._id = user.id;
    this.username = user.username;
    this.personal_name = user.personal_name;
    this.email = user.email;
    this.profile_picture = user.profile_picture;
  }
}



module.exports = UserResponseData;
