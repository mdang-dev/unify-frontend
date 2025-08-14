import httpClient from '@/src/utils/http-client.util';

const url = '/comments';

export const commentsCommandApi = {
  createComment: async (data) => {
    try {
      const res = await httpClient.post(url, data);
      return res.data; // Trả về dữ liệu nếu thành công
    } catch (error) {
      // Xử lý lỗi từ server
      if (error.response) {
        // Server trả về lỗi với mã trạng thái (status code)
        const { status, data } = error.response;
        console.error(`Lỗi từ server: ${status}`, data);

        // Xử lý các lỗi cụ thể dựa trên mã trạng thái hoặc thông điệp lỗi
        if (status === 400) {
  throw new Error(data.message || 'Invalid data submitted');
} else if (status === 401) {
  throw new Error('Unable to comment');
} else if (status === 500) {
  throw new Error('Comments are disabled for this post');
} else {
  throw new Error(data.message || 'An unknown error occurred');
}
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        console.error('Không nhận được phản hồi từ server:', error.request);
        throw new Error('Không thể kết nối đến server');
      } else {
        // Lỗi khác (ví dụ: lỗi cấu hình request)
        console.error('Lỗi khi gửi yêu cầu:', error.message);
        throw new Error('Lỗi khi gửi yêu cầu');
      }
    }
  },
  deleteComment: async (commentId) => {
    try {
      const res = await httpClient.delete(`${url}/${commentId}`);
      return res.data;
    } catch (error) {
      console.error('Lỗi khi xóa comment:', error);
      throw error;
    }
  },
};